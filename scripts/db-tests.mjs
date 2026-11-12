#!/usr/bin/env node
/**
 * Phase 3 database tests.
 *   node scripts/db-tests.mjs generate          -> writes supabase/tests/phase3_security.test.sql
 *   node scripts/db-tests.mjs local <pg-url>    -> fresh database: shim + all migrations + security suite
 * The generated SQL can also be run on staging; it always rolls back (see the cases file).
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateSql } from "../supabase/tests/phase3-security.cases.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "supabase", "tests", "phase3_security.test.sql");

export function parseSummary(message) {
  const m = /DFTEST_SUMMARY (\{.*\})/s.exec(message ?? "");
  return m ? JSON.parse(m[1]) : null;
}

export function printSummary(s) {
  for (const r of s.results) console.log(`${r.ok ? "  ok  " : "  FAIL"}  ${r.t}${r.ok ? "" : `  -> got: ${r.got}`}`);
  console.log(`\n${s.passed} passed, ${s.failed} failed`);
}

async function local(url) {
  const { default: pg } = await import(process.env.PG_MODULE ?? "pg");
  const admin = new pg.Client({ connectionString: url });
  await admin.connect();
  const db = `dftest_${Date.now()}`;
  await admin.query(`create database ${db}`);
  await admin.end();
  const c = new pg.Client({ connectionString: url.replace(/\/[^/]*$/, "/" + db) });
  await c.connect();
  try {
    await c.query(readFileSync(join(ROOT, "supabase/tests/local-shim.sql"), "utf8"));
    for (const f of readdirSync(join(ROOT, "supabase/migrations")).filter((f) => f.endsWith(".sql")).sort()) {
      await c.query(readFileSync(join(ROOT, "supabase/migrations", f), "utf8"));
      console.log(`applied ${f}`);
    }
    let summary = null;
    try {
      await c.query(readFileSync(OUT, "utf8"));
    } catch (e) {
      summary = parseSummary(e.message);
      if (!summary) throw e;
    }
    printSummary(summary);
    process.exitCode = summary.failed ? 1 : 0;
  } finally {
    await c.end();
  }
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "generate") {
  writeFileSync(OUT, generateSql());
  console.log(`wrote ${OUT}`);
} else if (cmd === "local") {
  await local(arg ?? "postgres://postgres@127.0.0.1:54329/postgres");
} else if (cmd) {
  console.error("usage: db-tests.mjs generate | local <pg-url>");
  process.exit(2);
}
