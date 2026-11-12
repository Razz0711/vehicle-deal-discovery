import { test } from "node:test";
import assert from "node:assert/strict";
import { EnvError, isPrivilegedKey, parsePublicEnv } from "./env.ts";

// Fake fixtures only.
const FAKE_SECRET = ["sb", "secret", "fakefakefake"].join("_"); // assembled so the repo scan stays clean
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (payload: object) => `${b64({ alg: "HS256" })}.${b64(payload)}.c2ln`;

const staging = {
  NEXT_PUBLIC_APP_ENV: "staging",
  NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnop.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fakefakefake",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAAAfake",
};

test("accepts a valid staging configuration", () => {
  const env = parsePublicEnv(staging);
  assert.equal(env.appEnv, "staging");
  assert.equal(env.supabaseUrl, "https://abcdefghijklmnop.supabase.co");
  assert.equal(env.turnstileSiteKey, "0x4AAAAAAAfake");
});

test("refuses a secret key in the publishable slot", () => {
  assert.throws(() => parsePublicEnv({ ...staging, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: FAKE_SECRET }), EnvError);
  assert.throws(
    () => parsePublicEnv({ ...staging, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwt({ role: "service_role" }) }),
    EnvError,
  );
});

test("isPrivilegedKey distinguishes anon from service_role", () => {
  assert.equal(isPrivilegedKey(jwt({ role: "anon" })), false);
  assert.equal(isPrivilegedKey(jwt({ role: "service_role" })), true);
  assert.equal(isPrivilegedKey("sb_publishable_x"), false);
});

test("requires URL and key", () => {
  assert.throws(() => parsePublicEnv({ ...staging, NEXT_PUBLIC_SUPABASE_URL: "" }), /NEXT_PUBLIC_SUPABASE_URL is not set/);
  assert.throws(() => parsePublicEnv({ ...staging, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: " " }), /PUBLISHABLE_KEY is not set/);
});

test("requires https except for the local loopback stack", () => {
  assert.throws(() => parsePublicEnv({ ...staging, NEXT_PUBLIC_SUPABASE_URL: "http://abc.supabase.co" }), /https/);
  const local = parsePublicEnv({
    NEXT_PUBLIC_APP_ENV: "local",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local",
  });
  assert.equal(local.turnstileSiteKey, null);
});

test("CAPTCHA site key is optional while phone sign-in is paused (D3-13)", () => {
  assert.equal(parsePublicEnv({ ...staging, NEXT_PUBLIC_TURNSTILE_SITE_KEY: "" }).turnstileSiteKey, null);
});

test("rejects unknown app environments", () => {
  assert.throws(() => parsePublicEnv({ ...staging, NEXT_PUBLIC_APP_ENV: "prod" }), /NEXT_PUBLIC_APP_ENV/);
});
