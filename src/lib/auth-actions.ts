"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { publicEnv } from "@/lib/env";
import { otpLimiterToken } from "@/lib/env.server";
import { SUPABASE_CONFIGURED } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { clientIpFrom, onboardCore, requestOtpCore, verifyOtpCore, type AuthResult, type OnboardingInput, type VerifyResult } from "@/lib/auth/core";

/** Step 1: send a one-time code. Same behaviour for new and existing numbers (decision D3-7). */
export async function requestOtp(mobile: string, captchaToken?: string): Promise<AuthResult> {
  if (!SUPABASE_CONFIGURED) return { ok: false, reason: "not-configured" };
  const env = publicEnv();
  const supabase = await createClient();
  const h = await headers();
  return requestOtpCore(
    {
      limiterToken: otpLimiterToken(),
      clientIp: clientIpFrom((n) => h.get(n)),
      captchaRequired: !!env.turnstileSiteKey,
      consumeQuota: async (token, phone, ip) => {
        const { data, error } = await supabase.rpc("consume_otp_quota", { p_token: token, p_phone: phone, p_ip: ip });
        return { data: data as { allowed: boolean; reason: string | null; retry_after_seconds: number }[] | null, error };
      },
      refundQuota: async (token, phone) => {
        const { error } = await supabase.rpc("refund_otp_quota", { p_token: token, p_phone: phone });
        return { error };
      },
      sendOtp: async (phone, token) => {
        const { error } = await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: true, channel: "sms", captchaToken: token } });
        return { error };
      },
    },
    { mobile, captchaToken },
  );
}

/** Step 2: check the code. On success the session cookie is set by @supabase/ssr. */
export async function verifyOtp(mobile: string, code: string, next?: string): Promise<VerifyResult> {
  if (!SUPABASE_CONFIGURED) return { ok: false, reason: "not-configured" };
  const supabase = await createClient();
  return verifyOtpCore(
    {
      verify: async (phone, token) => {
        const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
        return { error };
      },
      loadProfile: async () => {
        const { data } = await supabase.from("profiles").select("onboarded_at, status").maybeSingle();
        return data ? { onboarded: !!data.onboarded_at, status: data.status } : null;
      },
    },
    { mobile, code, next },
  );
}

/** Step 3 (first sign-in only): profile + privacy and terms consents, in one database transaction. */
export async function completeOnboarding(input: OnboardingInput, context: "register" | "onboarding"): Promise<AuthResult> {
  if (!SUPABASE_CONFIGURED) return { ok: false, reason: "not-configured" };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  return onboardCore(
    {
      signedIn: !!claims?.sub && claims.is_anonymous !== true,
      currentDocuments: async () => {
        const nowIso = new Date().toISOString();
        const { data: docs } = await supabase
          .from("legal_documents")
          .select("id, kind, effective_from")
          .in("kind", ["privacy_notice", "terms"])
          .lte("effective_from", nowIso)
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

/** Optional preference after onboarding. RLS limits the update to the caller's own row. */
export async function savePreferences(condition: "new" | "used" | null): Promise<AuthResult> {
  if (!SUPABASE_CONFIGURED) return { ok: false, reason: "not-configured" };
  if (condition !== null && condition !== "new" && condition !== "used") return { ok: false, reason: "invalid-details" };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return { ok: false, reason: "not-signed-in" };
  const { error } = await supabase.from("profiles").update({ condition_pref: condition }).eq("id", data.claims.sub);
  return error ? { ok: false, reason: "unexpected" } : { ok: true };
}

export async function signOut(): Promise<void> {
  if (SUPABASE_CONFIGURED) {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  }
  redirect("/");
}
