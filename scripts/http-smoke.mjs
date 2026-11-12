#!/usr/bin/env node
/**
 * HTTP checks against a running build (`npm run build && npm start`).
 *   node scripts/http-smoke.mjs http://localhost:3100
 * Covers protected-route redirects, safe `next` handling, cache headers, and forged / expired
 * session cookies. Needs no Supabase connectivity: every case here is decided before Auth is
 * reached, or must fail closed when Auth cannot confirm the session.
 */
import { createHmac, randomBytes } from "node:crypto";

const BASE = process.argv[2] ?? "http://localhost:3100";
const REF = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://rvcffforsepgrezvaxpm.supabase.co").hostname.split(".")[0];
const COOKIE = `sb-${REF}-auth-token`;
const DEALS = "/deals?v=car&s=GJ&c=ahmedabad&n=new&b=maruti-suzuki&m=swift&t=lxi";

const b64u = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
function jwt(payload, secret = randomBytes(32)) {
  const head = b64u({ alg: "HS256", typ: "JWT" });
  const body = b64u(payload);
  return `${head}.${body}.${createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url")}`;
}
function sessionCookie(accessToken) {
  const session = { access_token: accessToken, refresh_token: "forged-refresh-token", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: "aaaaaaaa-0000-4000-8000-00000000000a" } };
  return `${COOKIE}=base64-${b64u(session)}`;
}

let failed = 0;
async function check(name, path, { cookie, expectStatus, expectLocation, expectNoStore, bodyMustNotContain, bodyMustContain } = {}) {
  const res = await fetch(BASE + path, { redirect: "manual", headers: cookie ? { cookie } : {} });
  const loc = res.headers.get("location") ?? "";
  const cc = res.headers.get("cache-control") ?? "";
  const body = res.status === 200 ? await res.text() : "";
  const problems = [];
  if (expectStatus && !expectStatus.includes(res.status)) problems.push(`status ${res.status}`);
  if (expectLocation !== undefined) {
    const got = loc ? new URL(loc, BASE).pathname + new URL(loc, BASE).search : "";
    if (got !== expectLocation) problems.push(`location ${got || "(none)"}`);
  }
  if (expectNoStore && !/no-store/.test(cc)) problems.push(`cache-control "${cc}"`);
  if (bodyMustNotContain && body.includes(bodyMustNotContain)) problems.push(`body contains ${bodyMustNotContain}`);
  if (bodyMustContain && !body.includes(bodyMustContain)) problems.push(`body lacks ${bodyMustContain}`);
  console.log(`${problems.length ? "  FAIL" : "  ok  "}  ${name}${problems.length ? "  -> " + problems.join("; ") : ""}`);
  if (problems.length) failed++;
}

const enc = encodeURIComponent;
const now = Math.floor(Date.now() / 1000);

console.log("Protected routes, signed out");
await check("/deals sends signed-out visitors to sign-in, keeping their selections", DEALS, { expectStatus: [307, 308], expectLocation: `/signin?next=${enc(DEALS)}`, expectNoStore: true });
await check("/partner requires sign-in", "/partner", { expectStatus: [307], expectLocation: `/signin?next=${enc("/partner")}`, expectNoStore: true });
await check("/admin requires sign-in", "/admin", { expectStatus: [307], expectLocation: `/signin?next=${enc("/admin")}`, expectNoStore: true });
await check("/account requires sign-in", "/account", { expectStatus: [307], expectLocation: `/signin?next=${enc("/account")}`, expectNoStore: true });
await check("/onboarding requires sign-in (no next loop)", "/onboarding?next=/deals", { expectStatus: [307], expectLocation: "/signin", expectNoStore: true });
// Sub-paths are protected too; their next is dropped because only exact known routes are allowed.
await check("/partner/anything is covered too", "/partner/settings", { expectStatus: [307], expectLocation: "/signin" });

console.log("Public pages stay public");
for (const p of ["/", "/explore", "/state?v=car", "/privacy", "/terms", "/register", "/signin"]) await check(`${p} is public`, p, { expectStatus: [200] });

console.log("Safe next handling on sign-in and register");
// Next.js echoes the page's own URL in its router state, so the test checks the form's `next`
// value (a hidden field in the server-rendered Google form) and the line rendered only when a
// next destination was accepted.
const REJECTED = { expectStatus: [200], bodyMustNotContain: "Sign in to see actual offers" };
await check("absolute next URL is dropped", "/signin?next=https://evil.example/x", REJECTED);
await check("absolute next is not passed to the form", "/signin?next=https://evil.example/x", { expectStatus: [200], bodyMustNotContain: 'name="next" value="https:' });
await check("protocol-relative next is dropped", "/signin?next=//evil.example", REJECTED);
await check("protocol-relative next is not passed to the form", "/signin?next=//evil.example", { expectStatus: [200], bodyMustNotContain: 'name="next" value="//' });
await check("backslash next is not passed to the register form", "/register?next=/%5Cevil.example", { expectStatus: [200], bodyMustNotContain: 'name="next" value="/\\' });
await check("a known next is kept", `/signin?next=${enc(DEALS)}`, { expectStatus: [200], bodyMustContain: "Sign in to see actual offers" });
await check("a known next reaches the form", `/signin?next=${enc(DEALS)}`, { expectStatus: [200], bodyMustContain: 'name="next" value="/deals?v=car' });

console.log("Forged and expired sessions fail closed");
await check("garbage session cookie", DEALS, { cookie: `${COOKIE}=base64-bm90LWEtc2Vzc2lvbg`, expectStatus: [307], expectLocation: `/signin?next=${enc(DEALS)}` });
await check("JWT signed with an attacker's key", DEALS, { cookie: sessionCookie(jwt({ sub: "aaaaaaaa-0000-4000-8000-00000000000a", role: "authenticated", aud: "authenticated", exp: now + 3600, is_anonymous: false, aal: "aal2" })), expectStatus: [307], expectLocation: `/signin?next=${enc(DEALS)}` });
await check("expired JWT with a bogus refresh token", DEALS, { cookie: sessionCookie(jwt({ sub: "aaaaaaaa-0000-4000-8000-00000000000a", role: "authenticated", aud: "authenticated", exp: now - 60 })), expectStatus: [307], expectLocation: `/signin?next=${enc(DEALS)}` });
await check("unsigned (alg none) JWT claiming staff aal2", "/admin", { cookie: sessionCookie(`${b64u({ alg: "none", typ: "JWT" })}.${b64u({ sub: "x", role: "service_role", aal: "aal2", exp: now + 3600 })}.`), expectStatus: [307], expectLocation: `/signin?next=${enc("/admin")}` });

console.log("Google sign-in (D3-13)");
await check("callback without a code returns to sign-in", "/auth/callback", { expectStatus: [307], expectLocation: "/signin?error=oauth", expectNoStore: true });
await check("cancelled at Google, next kept", "/auth/callback?error=access_denied&next=%2Fdeals", { expectStatus: [307], expectLocation: "/signin?error=cancelled&next=%2Fdeals" });
await check("forged code is refused, next kept", `/auth/callback?code=forged-code&next=${enc(DEALS)}`, { expectStatus: [307], expectLocation: `/signin?error=oauth&next=${enc(DEALS)}` });
await check("callback never redirects off-site", "/auth/callback?code=forged-code&next=https://evil.example", { expectStatus: [307], expectLocation: "/signin?error=oauth" });
await check("sign-in error message is shown", "/signin?error=oauth", { expectStatus: [200], bodyMustContain: "Google sign-in did not complete" });

// Submit the real "Continue with Google" form the way a browser without JavaScript does.
async function submitGoogle(next) {
  const page = await fetch(BASE + "/signin" + (next ? `?next=${enc(next)}` : ""));
  const html = await page.text();
  const action = /name="(\$ACTION_ID_[^"]+)"/.exec(html)?.[1];
  const fd = new FormData();
  if (action) fd.set(action, "");
  if (next !== undefined) fd.set("next", next);
  const res = await fetch(BASE + "/signin", { method: "POST", body: fd, redirect: "manual" });
  return { action, res };
}
{
  const { action, res } = await submitGoogle(DEALS);
  const loc = res.headers.get("location") ?? "";
  const u = loc.startsWith("http") ? new URL(loc) : null;
  const redirectTo = u?.searchParams.get("redirect_to") ?? "";
  const cookies = res.headers.getSetCookie?.() ?? [];
  const problems = [];
  if (!action) problems.push("no server action in the form");
  if (![303, 307].includes(res.status)) problems.push(`status ${res.status}`);
  if (u?.origin !== `https://${REF}.supabase.co` || u?.pathname !== "/auth/v1/authorize") problems.push(`location ${loc.slice(0, 80)}`);
  if (u?.searchParams.get("provider") !== "google") problems.push("provider");
  if (!/^s256$/i.test(u?.searchParams.get("code_challenge_method") ?? "")) problems.push("no PKCE");
  if (redirectTo !== `http://localhost:3000/auth/callback?next=${enc(DEALS)}`) problems.push(`redirect_to ${redirectTo}`);
  if (!cookies.some((c) => /-auth-token-code-verifier=/.test(c))) problems.push("no code-verifier cookie");
  console.log(`${problems.length ? "  FAIL" : "  ok  "}  no-JS "Continue with Google" goes to this project's Google authorisation with PKCE and our callback${problems.length ? "  -> " + problems.join("; ") : ""}`);
  if (problems.length) failed++;
}
{
  const { res } = await submitGoogle("https://evil.example/steal");
  const loc = res.headers.get("location") ?? "";
  const redirectTo = loc.startsWith("http") ? new URL(loc).searchParams.get("redirect_to") : "";
  const ok = redirectTo === "http://localhost:3000/auth/callback";
  console.log(`${ok ? "  ok  " : "  FAIL"}  a tampered next in the form is dropped from the return address${ok ? "" : "  -> " + redirectTo}`);
  if (!ok) failed++;
}

console.log(failed ? `\n${failed} check(s) failed` : "\nall HTTP checks passed");
process.exitCode = failed ? 1 : 0;
