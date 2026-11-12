import { test } from "node:test";
import assert from "node:assert/strict";
import { onboardingUrl, safeNext, signInUrl } from "./redirect.ts";

test("keeps known relative routes, with their query", () => {
  assert.equal(safeNext("/deals?v=car&s=GJ&c=ahmedabad"), "/deals?v=car&s=GJ&c=ahmedabad");
  assert.equal(safeNext("/explore"), "/explore");
  assert.equal(safeNext("/partner"), "/partner");
  assert.equal(safeNext("/deals/"), "/deals");
});

test("rejects open-redirect tricks", () => {
  const evil = [
    "https://evil.example/deals",
    "//evil.example/deals",
    "/\\evil.example",
    "\\\\evil.example",
    "/%2F%2Fevil.example",
    "javascript:alert(1)",
    " /deals",
    "/deals\n/x",
    "/deals\u0000",
    "deals",
    "",
    "/" + "a".repeat(3000),
  ];
  for (const raw of evil) assert.equal(safeNext(raw), "/explore", JSON.stringify(raw));
});

test("rejects unknown and auth-loop routes", () => {
  for (const raw of ["/signin", "/register", "/onboarding", "/api/x", "/admin-tools", "/dealsx"]) assert.equal(safeNext(raw), "/explore", raw);
});

test("drops fragments and normalises dot segments to known routes only", () => {
  assert.equal(safeNext("/deals#top"), "/deals");
  assert.equal(safeNext("/x/../deals"), "/deals");
  assert.equal(safeNext("/deals/../../signin"), "/explore");
});

test("non-strings fall back", () => {
  assert.equal(safeNext(undefined), "/explore");
  assert.equal(safeNext(["/deals"]), "/explore");
  assert.equal(safeNext(42, "/"), "/");
});

test("sign-in and onboarding URLs carry only safe next values", () => {
  assert.equal(signInUrl("/deals?v=car"), "/signin?next=%2Fdeals%3Fv%3Dcar");
  assert.equal(signInUrl("https://evil.example"), "/signin");
  assert.equal(onboardingUrl("/deals"), "/onboarding?next=%2Fdeals");
  assert.equal(onboardingUrl(), "/onboarding");
});
