import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIpFrom, mapAuthError, normaliseMobile, onboardCore, requestOtpCore, validateOnboarding, verifyOtpCore, type OnboardDeps, type RequestOtpDeps } from "./core.ts";

// ---- fakes -------------------------------------------------------------------------------------
function otpDeps(over: Partial<RequestOtpDeps> = {}) {
  const calls = { consume: [] as string[][], refund: [] as string[][], send: [] as (string | undefined)[][] };
  const deps: RequestOtpDeps = {
    limiterToken: "t".repeat(64),
    clientIp: "203.0.113.5",
    captchaRequired: true,
    consumeQuota: async (t, p, ip) => (calls.consume.push([t, p, ip]), { data: [{ allowed: true, reason: null, retry_after_seconds: 0 }], error: null }),
    refundQuota: async (t, p) => (calls.refund.push([t, p]), { error: null }),
    sendOtp: async (p, c) => (calls.send.push([p, c]), { error: null }),
    ...over,
  };
  return { deps, calls };
}

// ---- phone numbers -------------------------------------------------------------------------------
test("normaliseMobile accepts Indian mobile formats and rejects others", () => {
  for (const ok of ["9000000001", "+91 90000 00001", "91-9000000001", "0 9000000001"]) assert.equal(normaliseMobile(ok), "9000000001", ok);
  for (const bad of ["5000000001", "900000001", "90000000011", "+1 4155552671", "abc"]) assert.equal(normaliseMobile(bad), null, bad);
});

// ---- error mapping -------------------------------------------------------------------------------
test("Supabase errors map to neutral messages", () => {
  assert.equal(mapAuthError({ code: "captcha_failed", status: 400 }), "captcha");
  assert.equal(mapAuthError({ code: "otp_expired", status: 403 }), "wrong-or-expired-code");
  assert.equal(mapAuthError({ code: "over_sms_send_rate_limit", status: 429 }), "too-many-attempts");
  assert.equal(mapAuthError({ status: 429 }), "too-many-attempts");
  assert.equal(mapAuthError({ code: "phone_provider_disabled", status: 400 }), "not-configured");
  assert.equal(mapAuthError({ code: "sms_send_failed", status: 500 }), "sms-failed");
  assert.equal(mapAuthError({ name: "AuthRetryableFetchError", status: 0 }), "network");
  assert.equal(mapAuthError({ code: "something_new", status: 500 }), "unexpected");
});

// ---- requesting a code ---------------------------------------------------------------------------
test("new or existing number: limiter is consulted, then a code is sent with the CAPTCHA token", async () => {
  const { deps, calls } = otpDeps();
  assert.deepEqual(await requestOtpCore(deps, { mobile: "90000 00001", captchaToken: "cf-token" }), { ok: true });
  assert.deepEqual(calls.consume, [["t".repeat(64), "+919000000001", "203.0.113.5"]]);
  assert.deepEqual(calls.send, [["+919000000001", "cf-token"]]);
});

test("invalid number is refused before any call", async () => {
  const { deps, calls } = otpDeps();
  assert.deepEqual(await requestOtpCore(deps, { mobile: "12345", captchaToken: "x" }), { ok: false, reason: "invalid-number" });
  assert.equal(calls.consume.length + calls.send.length, 0);
});

test("missing CAPTCHA token is refused before using any quota", async () => {
  const { deps, calls } = otpDeps();
  assert.deepEqual(await requestOtpCore(deps, { mobile: "9000000001" }), { ok: false, reason: "captcha" });
  assert.equal(calls.consume.length, 0);
});

test("CAPTCHA failure at Supabase: refused, and the number's attempt is refunded", async () => {
  const { deps, calls } = otpDeps({ sendOtp: async () => ({ error: { code: "captcha_failed", status: 400 } }) });
  assert.deepEqual(await requestOtpCore(deps, { mobile: "9000000001", captchaToken: "forged" }), { ok: false, reason: "captcha" });
  assert.deepEqual(calls.refund, [["t".repeat(64), "+919000000001"]]);
});

test("other send failures are not refunded", async () => {
  const { deps, calls } = otpDeps({ sendOtp: async () => ({ error: { code: "over_sms_send_rate_limit", status: 429 } }) });
  assert.equal((await requestOtpCore(deps, { mobile: "9000000001", captchaToken: "x" })).ok, false);
  assert.equal(calls.refund.length, 0);
});

test("app rate limit refuses without sending, and reports the wait", async () => {
  const { deps, calls } = otpDeps({ consumeQuota: async () => ({ data: [{ allowed: false, reason: "phone_daily_limit", retry_after_seconds: 7200 }], error: null }) });
  assert.deepEqual(await requestOtpCore(deps, { mobile: "9000000001", captchaToken: "x" }), { ok: false, reason: "too-many-attempts", retryAfterSeconds: 7200 });
  assert.equal(calls.send.length, 0);
});

test("limiter misconfigured or failing: fail closed, nothing sent", async () => {
  for (const over of [{ limiterToken: null }, { consumeQuota: async () => ({ data: null, error: { code: "42501", message: "not authorised" } }) }] as Partial<RequestOtpDeps>[]) {
    const { deps, calls } = otpDeps(over);
    assert.deepEqual(await requestOtpCore(deps, { mobile: "9000000001", captchaToken: "x" }), { ok: false, reason: "unavailable" });
    assert.equal(calls.send.length, 0);
  }
});

test("local stack without CAPTCHA: token not required", async () => {
  const { deps } = otpDeps({ captchaRequired: false });
  assert.deepEqual(await requestOtpCore(deps, { mobile: "9000000001" }), { ok: true });
});

// ---- verifying a code ----------------------------------------------------------------------------
const verifyDeps = (error: object | null, profile: { onboarded: boolean; status: string } | null) => ({
  verify: async () => ({ error }),
  loadProfile: async () => profile,
});

test("existing registered user: verified and sent to a safe next", async () => {
  assert.deepEqual(await verifyOtpCore(verifyDeps(null, { onboarded: true, status: "active" }), { mobile: "9000000001", code: "123456", next: "/deals?v=car" }), { ok: true, onboarded: true, redirectTo: "/deals?v=car" });
  assert.deepEqual(await verifyOtpCore(verifyDeps(null, { onboarded: true, status: "active" }), { mobile: "9000000001", code: "123456", next: "https://evil.example" }), { ok: true, onboarded: true, redirectTo: "/explore" });
});

test("new user: verified and sent to onboarding with next", async () => {
  assert.deepEqual(await verifyOtpCore(verifyDeps(null, null), { mobile: "9000000001", code: "123456", next: "/deals" }), { ok: true, onboarded: false, redirectTo: "/onboarding?next=%2Fdeals" });
});

test("suspended user is sent to the account page, not to deals", async () => {
  const r = await verifyOtpCore(verifyDeps(null, { onboarded: true, status: "suspended" }), { mobile: "9000000001", code: "123456", next: "/deals" });
  assert.deepEqual(r, { ok: true, onboarded: true, redirectTo: "/account" });
});

test("wrong or expired code", async () => {
  assert.deepEqual(await verifyOtpCore(verifyDeps({ code: "otp_expired", status: 403 }, null), { mobile: "9000000001", code: "000000" }), { ok: false, reason: "wrong-or-expired-code" });
});

test("malformed codes are refused without calling Supabase", async () => {
  let called = false;
  const deps = { verify: async () => ((called = true), { error: null }), loadProfile: async () => null };
  for (const code of ["12345", "1234567", "12a456", ""]) assert.deepEqual(await verifyOtpCore(deps, { mobile: "9000000001", code }), { ok: false, reason: "wrong-or-expired-code" });
  assert.equal(called, false);
});

// ---- onboarding ----------------------------------------------------------------------------------
const good = { name: "  Asha   Patel ", email: "asha@example.com", state: "GJ", city: "Ahmedabad", adult: true, consent: true };

test("server-side validation", () => {
  assert.deepEqual(validateOnboarding(good), { ok: true, value: { name: "Asha Patel", email: "asha@example.com", state: "GJ", city: "Ahmedabad", condition: null } });
  const bad = validateOnboarding({ name: "A", email: "nope", state: "XX", city: "Atlantis", adult: false, consent: false, condition: "vintage" });
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.deepEqual(Object.keys(bad.fields).sort(), ["adult", "condition", "consent", "email", "name", "state"]);
  const wrongCity = validateOnboarding({ ...good, city: "Mumbai" });
  assert.ok(!wrongCity.ok && "city" in wrongCity.fields);
});

function onboardDeps(over: Partial<OnboardDeps> = {}) {
  const sent: unknown[] = [];
  const deps: OnboardDeps = {
    signedIn: true,
    currentDocuments: async () => ({ privacy: "p-id", terms: "t-id" }),
    complete: async (args) => (sent.push(args), { error: null }),
    ...over,
  };
  return { deps, sent };
}

test("onboarding sends validated values and current document ids", async () => {
  const { deps, sent } = onboardDeps();
  assert.deepEqual(await onboardCore(deps, good, "register"), { ok: true });
  assert.deepEqual(sent[0], { p_full_name: "Asha Patel", p_email: "asha@example.com", p_state_code: "GJ", p_city_name: "Ahmedabad", p_condition_pref: null, p_is_adult_declared: true, p_privacy_document_id: "p-id", p_terms_document_id: "t-id", p_channel: "web", p_context: "register" });
});

test("onboarding refusals", async () => {
  assert.deepEqual(await onboardCore(onboardDeps({ signedIn: false }).deps, good, "x"), { ok: false, reason: "not-signed-in" });
  assert.equal((await onboardCore(onboardDeps().deps, { ...good, adult: false }, "x")).ok, false);
  assert.deepEqual(await onboardCore(onboardDeps({ currentDocuments: async () => ({ privacy: null, terms: "t" }) }).deps, good, "x"), { ok: false, reason: "unavailable" });
  const email = await onboardCore(onboardDeps({ complete: async () => ({ error: { code: "23505", message: 'duplicate key value violates unique constraint "profiles_email_lower_key"' } }) }).deps, good, "x");
  assert.equal(email.ok === false && email.reason, "email-in-use");
  const again = await onboardCore(onboardDeps({ complete: async () => ({ error: { code: "23505", message: "already registered" } }) }).deps, good, "x");
  assert.equal(again.ok === false && again.reason, "already-registered");
  const outdated = await onboardCore(onboardDeps({ complete: async () => ({ error: { code: "22023", message: "legal document version is not current" } }) }).deps, good, "x");
  assert.equal(outdated.ok === false && outdated.reason, "outdated-terms");
});

test("client IP comes from platform headers, bounded in length", () => {
  const h = (m: Record<string, string>) => (n: string) => m[n] ?? null;
  assert.equal(clientIpFrom(h({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "1.1.1.1" })), "203.0.113.7");
  assert.equal(clientIpFrom(h({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" })), "198.51.100.1");
  assert.equal(clientIpFrom(h({})), "unknown");
  assert.equal(clientIpFrom(h({ "x-real-ip": "x".repeat(200) })).length, 64);
});
