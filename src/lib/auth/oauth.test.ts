import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { oauthCallbackUrl } from "./core.ts";

// Uses the real supabase-js to build the Google authorisation URL. No network is needed:
// the PKCE verifier is generated locally and only the URL is inspected.
test("Google sign-in URL: this project's Auth server, PKCE S256, our callback", async () => {
  const store = new Map<string, string>();
  const supabase = createClient("https://abcdefghijklmnop.supabase.co", "sb_publishable_test", {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: false,
      storage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => void store.set(k, v), removeItem: (k) => void store.delete(k) },
    },
  });
  const redirectTo = oauthCallbackUrl("http://localhost:3000", "/deals?v=car");
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect: true } });
  assert.equal(error, null);
  const url = new URL(data.url!);
  assert.equal(url.origin + url.pathname, "https://abcdefghijklmnop.supabase.co/auth/v1/authorize");
  assert.equal(url.searchParams.get("provider"), "google");
  assert.equal(url.searchParams.get("redirect_to"), "http://localhost:3000/auth/callback?next=%2Fdeals%3Fv%3Dcar");
  assert.equal(url.searchParams.get("code_challenge_method")?.toLowerCase(), "s256");
  assert.ok((url.searchParams.get("code_challenge") ?? "").length >= 43, "code challenge present");
  assert.ok([...store.keys()].some((k) => k.endsWith("-code-verifier")), "verifier kept locally, not in the URL");
  assert.ok(![...url.searchParams.values()].some((v) => [...store.values()].some((sv) => sv.includes(v) && v.length > 20 && v !== url.searchParams.get("code_challenge"))), "verifier not leaked");
});
