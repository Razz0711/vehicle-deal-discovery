import { test } from "node:test";
import assert from "node:assert/strict";
import { findSecrets, isForbiddenEnvFile } from "./check-secrets.mjs";

// Fake fixtures only. None of these are real credentials.
const FAKE_SECRET = ["sb", "secret", "abcdefghijklmnop"].join("_"); // assembled so the repo scan stays clean
const PEM = ["-----BEGIN", "PRIVATE KEY-----"].join(" ");
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (payload) => `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}.c2lnbmF0dXJlLWZha2U`;

test("flags Supabase secret keys", () => {
  assert.deepEqual(findSecrets(`KEY=${FAKE_SECRET}`).map((h) => h.rule), ["supabase-secret-key"]);
});

test("flags service_role JWTs but allows anon JWTs", () => {
  assert.equal(findSecrets(jwt({ iss: "supabase", role: "service_role" }))[0]?.rule, "service-role-jwt");
  assert.equal(findSecrets(jwt({ iss: "supabase", role: "anon" })).length, 0);
});

test("allows publishable keys", () => {
  assert.equal(findSecrets("sb_publishable_OLbDD44v1WJ6973D06r").length, 0);
});

test("flags database URLs with real passwords, allows placeholders", () => {
  assert.equal(findSecrets(["postgresql://postgres", "hunter2xyz@db.example.co:5432/postgres"].join(":")).length, 1);
  assert.equal(findSecrets("postgresql://postgres:[YOUR-PASSWORD]@db.example.co:5432/postgres").length, 0);
  assert.equal(findSecrets("postgresql://postgres:postgres@127.0.0.1:54322/postgres").length, 0);
});

test("flags private key blocks", () => {
  assert.equal(findSecrets(PEM).length, 1);
});

test("env files: only the template may be tracked", () => {
  assert.equal(isForbiddenEnvFile(".env.example"), false);
  for (const f of [".env", ".env.local", ".env.production", "apps/x/.env.staging"]) assert.equal(isForbiddenEnvFile(f), true, f);
  assert.equal(isForbiddenEnvFile("src/lib/env.ts"), false);
});

test("flags a committed limiter token", () => {
  const line = ["OTP_LIMITER", "TOKEN=abcdef0123456789abcdef0123456789"].join("_");
  assert.equal(findSecrets(line)[0]?.rule, "otp-limiter-token");
  assert.equal(findSecrets("OTP_LIMITER_TOKEN=").length, 0);
});
