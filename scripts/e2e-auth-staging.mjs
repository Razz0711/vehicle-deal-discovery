#!/usr/bin/env node
/**
 * PAUSED with phone sign-in (decision D3-13). Kept for when SMS returns.
 * Live phone sign-in tests against the STAGING Supabase project. NOT for production.
 *   npm run test:e2e:staging
 *
 * Needs a machine that can reach *.supabase.co and these environment variables (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  (staging)
 *   E2E_PHONE_A, E2E_OTP_A, E2E_PHONE_B, E2E_OTP_B   staging test numbers and their fixed codes
 *                                                    (12 digits, e.g. 919000000001)
 *   E2E_CAPTCHA_TOKEN      a token Supabase will accept. With Turnstile's test secret
 *                          1x0000000000000000000000000000000AA configured in the dashboard, use
 *                          XXXX.DUMMY.TOKEN.XXXX. Leave unset if CAPTCHA is off.
 *   OTP_LIMITER_TOKEN      optional: enables the HTTP concurrency test of the limiter
 *
 * Test numbers create real staging users whose consent history cannot be deleted (decision D3-5).
 * Reuse the same two numbers; the script handles both first-run and repeat-run states.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
} catch {
  /* env from the shell */
}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const { E2E_PHONE_A, E2E_OTP_A, E2E_PHONE_B, E2E_OTP_B, E2E_CAPTCHA_TOKEN, OTP_LIMITER_TOKEN } = process.env;
if (!URL_ || !KEY || !E2E_PHONE_A || !E2E_OTP_A || !E2E_PHONE_B || !E2E_OTP_B) {
  console.error("Missing settings. See the header of scripts/e2e-auth-staging.mjs.");
  process.exit(2);
}
if (process.env.NEXT_PUBLIC_APP_ENV === "production") {
  console.error("Refusing to run against an environment marked production.");
  process.exit(2);
}

const client = () => createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
let failed = 0;
const ok = (name, cond, detail = "") => {
  console.log(`${cond ? "  ok  " : "  FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (!cond) failed++;
};
const e164 = (p) => "+" + p.replace(/^\+/, "");

async function signIn(phone, otp, label) {
  const c = client();
  const sent = await c.auth.signInWithOtp({ phone: e164(phone), options: { shouldCreateUser: true, captchaToken: E2E_CAPTCHA_TOKEN } });
  ok(`${label}: code requested`, !sent.error, sent.error?.code ?? "");
  const wrong = await c.auth.verifyOtp({ phone: e164(phone), token: otp === "000000" ? "111111" : "000000", type: "sms" });
  ok(`${label}: wrong code refused`, wrong.error?.code === "otp_expired", wrong.error?.code ?? "accepted!");
  const right = await c.auth.verifyOtp({ phone: e164(phone), token: otp, type: "sms" });
  ok(`${label}: right code accepted`, !right.error && !!right.data.session, right.error?.code ?? "");
  const { data: claims } = await c.auth.getClaims();
  ok(`${label}: verified, non-anonymous claims`, claims?.claims?.is_anonymous === false && claims?.claims?.phone === phone.replace(/^\+/, ""), JSON.stringify({ anon: claims?.claims?.is_anonymous, aal: claims?.claims?.aal }));
  return { c, session: right.data.session };
}

async function onboard(c, label, email) {
  const { data: existing } = await c.from("profiles").select("onboarded_at").maybeSingle();
  if (existing?.onboarded_at) {
    ok(`${label}: existing user (login path), already onboarded`, true);
    return;
  }
  const { data: docs } = await c.from("legal_documents").select("id, kind, effective_from").lte("effective_from", new Date().toISOString()).order("effective_from", { ascending: false });
  const pick = (k) => docs.find((d) => d.kind === k)?.id;
  const res = await c.rpc("complete_onboarding", { p_full_name: `E2E ${label}`, p_email: email, p_state_code: "GJ", p_city_name: "Ahmedabad", p_condition_pref: null, p_is_adult_declared: true, p_privacy_document_id: pick("privacy_notice"), p_terms_document_id: pick("terms"), p_channel: "web", p_context: "e2e" });
  ok(`${label}: new user onboarded`, !res.error, res.error?.message ?? "");
}

console.log("CAPTCHA");
{
  const r = await client().auth.signInWithOtp({ phone: e164(E2E_PHONE_A), options: { captchaToken: "definitely-not-a-valid-token" } });
  ok("forged CAPTCHA token refused by Supabase", r.error?.code === "captcha_failed", r.error?.code ?? "no error: is CAPTCHA enabled on staging?");
}

console.log("Registration, login, OTP");
const A = await signIn(E2E_PHONE_A, E2E_OTP_A, "A");
await onboard(A.c, "A", "e2e-a@example.com");
const B = await signIn(E2E_PHONE_B, E2E_OTP_B, "B");
await onboard(B.c, "B", "e2e-b@example.com");

console.log("Isolation over the real Data API");
{
  const { data: mine } = await A.c.from("profiles").select("id");
  ok("A sees exactly one profile (their own)", mine?.length === 1 && mine[0].id === A.session.user.id);
  const upd = await A.c.from("profiles").update({ full_name: "Hacked" }).eq("id", B.session.user.id).select();
  ok("A cannot update B's profile", !upd.error && upd.data.length === 0);
  const status = await A.c.from("profiles").update({ status: "active" }).eq("id", A.session.user.id);
  ok("A cannot change their own status", !!status.error, status.error?.code ?? "");
  const ce = await A.c.from("consent_events").update({ context: "tampered" }).eq("user_id", A.session.user.id);
  ok("consent events cannot be updated", !!ce.error, ce.error?.code ?? "");
  const cd = await A.c.from("consent_events").delete().eq("user_id", A.session.user.id);
  ok("consent events cannot be deleted", !!cd.error, cd.error?.code ?? "");
  const anon = await client().from("profiles").select("id");
  ok("signed-out requests cannot read profiles", !!anon.error, anon.error?.code ?? `rows=${anon.data?.length}`);
  const rl = await client().schema("private").from("rate_limits").select("*");
  ok("private schema is not exposed", !!rl.error, rl.error?.code ?? "");
}

console.log("Sessions");
{
  const refreshed = await A.c.auth.refreshSession({ refresh_token: A.session.refresh_token });
  ok("session refreshes with a valid refresh token", !refreshed.error && !!refreshed.data.session, refreshed.error?.code ?? "");
  const reuse = await client().auth.refreshSession({ refresh_token: A.session.refresh_token });
  ok("an already-used refresh token is refused (rotation)", !!reuse.error, reuse.error?.code ?? "accepted!");
  await A.c.auth.signOut();
  const after = await client().auth.refreshSession({ refresh_token: refreshed.data.session?.refresh_token ?? "x" });
  ok("after sign-out the refresh token no longer works", !!after.error, after.error?.code ?? "accepted!");
}

if (OTP_LIMITER_TOKEN) {
  console.log("Limiter over HTTP, 30 parallel requests for one fresh number");
  const phone = `+91${7000000000 + Math.floor(Math.random() * 999999999)}`;
  const results = await Promise.all(Array.from({ length: 30 }, (_, i) => client().rpc("consume_otp_quota", { p_token: OTP_LIMITER_TOKEN, p_phone: phone, p_ip: `e2e-${Date.now()}-${i}` })));
  const allowed = results.filter((r) => r.data?.[0]?.allowed).length;
  ok("exactly 5 allowed under concurrency", allowed === 5, `allowed=${allowed}, errors=${results.filter((r) => r.error).length}`);
}

console.log("Not testable with fixed test codes: an OTP that expires after its lifetime. Test it with a real number once an SMS provider is connected.");
console.log(failed ? `\n${failed} check(s) failed` : "\nall live checks passed");
process.exitCode = failed ? 1 : 0;
