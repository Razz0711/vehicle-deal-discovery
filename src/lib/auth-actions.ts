"use server";

import { redirect } from "next/navigation";
import { publicEnv } from "@/lib/env";
import { siteOrigin } from "@/lib/env.server";
import { SUPABASE_CONFIGURED } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { oauthCallbackUrl, onboardCore, type AuthResult, type OnboardingInput } from "@/lib/auth/core";
import { safeNext } from "@/lib/auth/redirect";

/**
 * Sign-in with Google (decision D3-13). Builds the PKCE authorisation URL (the code verifier is
 * stored in an HTTP cookie by @supabase/ssr) and sends the browser to Supabase, then Google.
 */
export async function signInWithGoogle(formData: FormData): Promise<void> {
  const next = safeNext(formData.get("next"), "");
  if (!SUPABASE_CONFIGURED) redirect(next ? `/signin?error=not-configured&next=${encodeURIComponent(next)}` : "/signin?error=not-configured");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: oauthCallbackUrl(siteOrigin(), next || undefined), queryParams: { prompt: "select_account" } },
  });
  // Only ever leave the site for this project's own Auth server.
  const target = data?.url ? new URL(data.url) : null;
  if (error || !target || target.origin !== new URL(publicEnv().supabaseUrl).origin) {
    redirect(next ? `/signin?error=oauth&next=${encodeURIComponent(next)}` : "/signin?error=oauth");
  }
  redirect(target.toString());
}

/** First sign-in only: profile + privacy and terms consents, in one database transaction. */
export async function completeOnboarding(input: OnboardingInput, context: "onboarding"): Promise<AuthResult> {
  if (!SUPABASE_CONFIGURED) return { ok: false, reason: "not-configured" };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  return onboardCore(
    {
      signedIn: !!claims?.sub && claims.is_anonymous !== true,
      currentDocuments: async () => {
        const { data: docs } = await supabase
          .from("legal_documents")
          .select("id, kind, effective_from")
          .in("kind", ["privacy_notice", "terms"])
          .lte("effective_from", new Date().toISOString())
          .order("effective_from", { ascending: false });
        const pick = (kind: string) => docs?.find((d) => d.kind === kind)?.id ?? null;
        return { privacy: pick("privacy_notice"), terms: pick("terms") };
      },
      complete: async (args) => {
        const { error } = await supabase.rpc("complete_onboarding", args);
        return { error };
      },
    },
    input,
    context,
  );
}

export async function signOut(): Promise<void> {
  if (SUPABASE_CONFIGURED) {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  }
  redirect("/");
}
