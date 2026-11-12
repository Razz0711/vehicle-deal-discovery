#!/usr/bin/env node
/**
 * Concurrency test for the OTP limiter, on real parallel PostgreSQL connections.
 *   node scripts/db-concurrency.mjs [pg-url]
 * Creates a fresh database (local shim + migrations), opens N connections as the `anon` role,
 * releases them at the same instant, and checks that exactly the limit succeeds.
 * Each call runs inside a transaction that stays open briefly afterwards, so the
 * transactions genuinely overlap and must queue on the counter row.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const URL_ = process.argv[2] ?? "postgres://postgres@127.0.0.1:54329/postgres";
const { default: pg } = await import(process.env.PG_MODULE ?? "pg");

async function freshDb() {
  const admin = new pg.Client({ connectionString: URL_ });
  await admin.connect();
  const db = `dfconc_${Date.now()}`;
  await admin.query(`create database ${db}`);
  await admin.end();
  const url = URL_.replace(/\/[^/]*$/, "/" + db);
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  await c.query(readFileSync(join(ROOT, "supabase/tests/local-shim.sql"), "utf8"));
  for (const f of readdirSync(join(ROOT, "supabase/migrations")).filter((f) => f.endsWith(".sql")).sort()) {
    await c.query(readFileSync(join(ROOT, "supabase/migrations", f), "utf8"));
  }
  const token = randomBytes(32).toString("hex");
  await c.query("select vault.create_secret($1, 'otp_limiter_token')", [token]);
  return { url, token, owner: c };
}

async function burst(url, n, makeArgs) {
  const clients = await Promise.all(
    Array.from({ length: n }, async () => {
      const c = new pg.Client({ connectionString: url });
      await c.connect();
      await c.query("set role anon");
      return c;
    }),
  );
  let release;
  const gate = new Promise((r) => (release = r));
  const runs = clients.map(async (c, i) => {
    await gate;
    await c.query("begin");
    const { rows } = await c.query("select allowed, reason from public.consume_otp_quota($1, $2, $3)", makeArgs(i));
    await c.query("select pg_sleep(0.05)"); // hold the transaction open so others must wait
    await c.query("commit");
    return rows[0];
  });
  const started = Date.now();
  release();
  const results = await Promise.all(runs);
  await Promise.all(clients.map((c) => c.end()));
  return { results, ms: Date.now() - started };
}

const { url, token, owner } = await freshDb();
let failures = 0;
const check = (label, ok, detail) => {
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${label}  (${detail})`);
  if (!ok) failures++;
};

// 1. Same number, 60 simultaneous requests from different IPs: exactly 5 may pass.
{
  const N = 60;
  const { results, ms } = await burst(url, N, (i) => [token, "+919000000501", `203.0.113.${i + 1}`]);
  const allowed = results.filter((r) => r.allowed).length;
  const reasons = new Set(results.filter((r) => !r.allowed).map((r) => r.reason));
  const { rows } = await owner.query("select count from private.rate_limits where bucket = 'otp_phone_day'");
  check(`${N} concurrent requests for one number`, allowed === 5 && rows[0].count === 5 && [...reasons].join() === "phone_daily_limit", `allowed=${allowed}, stored count=${rows[0].count}, refusals=${[...reasons].join()}, ${ms} ms`);
}

// 2. Same IP, 80 simultaneous requests for different numbers: exactly 20 may pass.
{
  const N = 80;
  const { results, ms } = await burst(url, N, (i) => [token, `+9190000006${String(i).padStart(2, "0")}`, "198.51.100.77"]);
  const allowed = results.filter((r) => r.allowed).length;
  const { rows } = await owner.query("select count from private.rate_limits where bucket = 'otp_ip_hour'");
  const phoneRows = await owner.query("select count(*)::int n from private.rate_limits where bucket = 'otp_phone_day'");
  check(`${N} concurrent requests from one IP`, allowed === 20 && rows.some((r) => r.count === 20) && phoneRows.rows[0].n === 1 + 20, `allowed=${allowed}, stored IP count=${Math.max(...rows.map((r) => r.count))}, per-number rows written=${phoneRows.rows[0].n - 1}, ${ms} ms`);
}

// 3. Repeat the single-number burst five times on fresh numbers to catch intermittent races.
{
  let worst = 0;
  for (let k = 0; k < 5; k++) {
    const { results } = await burst(url, 40, (i) => [token, `+91900000070${k}`, `192.0.2.${i + 1}`]);
    worst = Math.max(worst, Math.abs(results.filter((r) => r.allowed).length - 5));
  }
  check("5 repeated bursts of 40 (one number each)", worst === 0, `max deviation from limit=${worst}`);
}

// 4. Negative control: a naive read-then-write counter under the same burst MUST over-admit,
//    proving this test can detect a race (the control lives only in this throwaway database).
{
  await owner.query(`
    create table public.naive_counter (k text primary key, n int not null default 0);
    grant select, insert, update on public.naive_counter to anon;
    create function public.naive_consume(p_token text, p_phone text, p_ip text)
    returns table (allowed boolean, reason text) language plpgsql as $$
    declare cur int;
    begin
      select n into cur from public.naive_counter where k = p_phone;
      perform pg_sleep(0.01);
      if coalesce(cur, 0) >= 5 then return query select false, 'limit'::text; return; end if;
      insert into public.naive_counter values (p_phone, 1) on conflict (k) do update set n = public.naive_counter.n + 1;
      return query select true, null::text;
    end $$;
    grant execute on function public.naive_consume(text, text, text) to anon;`);
  const clients = await Promise.all(Array.from({ length: 40 }, async () => { const c = new pg.Client({ connectionString: url }); await c.connect(); await c.query("set role anon"); return c; }));
  let release; const gate = new Promise((r) => (release = r));
  const runs = clients.map(async (c) => { await gate; const { rows } = await c.query("select allowed from public.naive_consume('t', '+919000000999', 'x')"); return rows[0].allowed; });
  release();
  const allowed = (await Promise.all(runs)).filter(Boolean).length;
  await Promise.all(clients.map((c) => c.end()));
  check("negative control: naive read-then-write counter over-admits", allowed > 5, `naive allowed=${allowed} of 40 (limit 5)`);
}

await owner.end();
console.log(failures ? `\n${failures} concurrency check(s) failed` : "\nall concurrency checks passed");
process.exitCode = failures ? 1 : 0;
