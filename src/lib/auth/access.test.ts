import { test } from "node:test";
import assert from "node:assert/strict";
import { areaFor, decideAccess, type AuthState } from "./access.ts";

const signedOut: AuthState = { configured: true, user: null, profile: null };
const user = (o: Partial<{ anonymous: boolean; aal: string | null }> = {}) => ({ id: "u1", anonymous: false, aal: "aal1", ...o });
const buyer: AuthState = { configured: true, user: user(), profile: { onboarded: true, status: "active" } };
const unfinished: AuthState = { configured: true, user: user(), profile: null };
const suspended: AuthState = { configured: true, user: user(), profile: { onboarded: true, status: "suspended" } };
const anonymous: AuthState = { configured: true, user: user({ anonymous: true }), profile: { onboarded: true, status: "active" } };

test("protected prefixes", () => {
  assert.equal(areaFor("/deals"), "buyer");
  assert.equal(areaFor("/partner/x"), "partner");
  assert.equal(areaFor("/admin"), "admin");
  assert.equal(areaFor("/dealsx"), null);
  assert.equal(areaFor("/explore"), null);
});

test("signed-out visitors go to sign-in with a safe next", () => {
  assert.deepEqual(decideAccess(signedOut, "buyer", "/deals?v=car"), { action: "redirect", to: "/signin?next=%2Fdeals%3Fv%3Dcar" });
  assert.deepEqual(decideAccess({ configured: false }, "buyer", "/deals"), { action: "redirect", to: "/signin?next=%2Fdeals" });
});

test("anonymous users are treated as signed out everywhere", () => {
  for (const area of ["buyer", "partner", "admin", "account", "onboarding"] as const) {
    assert.equal(decideAccess(anonymous, area, "/deals").action, "redirect", area);
  }
});

test("unfinished accounts are sent to onboarding, carrying next", () => {
  assert.deepEqual(decideAccess(unfinished, "buyer", "/deals?v=car"), { action: "redirect", to: "/onboarding?next=%2Fdeals%3Fv%3Dcar" });
  assert.deepEqual(decideAccess(unfinished, "onboarding", "/deals"), { action: "allow" });
  assert.deepEqual(decideAccess(unfinished, "account", "/account"), { action: "allow" });
});

test("registered buyers reach deals; onboarding sends them on", () => {
  assert.deepEqual(decideAccess(buyer, "buyer", "/deals"), { action: "allow" });
  assert.deepEqual(decideAccess(buyer, "onboarding", "/deals?v=car"), { action: "redirect", to: "/deals?v=car" });
  assert.deepEqual(decideAccess(buyer, "onboarding", "https://evil.example"), { action: "redirect", to: "/explore" });
});

test("suspended accounts are refused", () => {
  assert.deepEqual(decideAccess(suspended, "buyer", "/deals"), { action: "deny", reason: "suspended" });
  assert.deepEqual(decideAccess(suspended, "partner", "/partner"), { action: "deny", reason: "suspended" });
});

test("admin fails closed: aal1 needs MFA, aal2 still has no grant in Phase 3", () => {
  assert.deepEqual(decideAccess(buyer, "admin", "/admin"), { action: "deny", reason: "mfa-required" });
  const aal2: AuthState = { ...buyer, user: user({ aal: "aal2" }) } as AuthState;
  assert.deepEqual(decideAccess(aal2, "admin", "/admin"), { action: "deny", reason: "no-staff-access" });
});
