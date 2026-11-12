/**
 * Phone sign-in and onboarding logic, independent of Next.js and Supabase clients so it can be
 * unit-tested with fakes. Server actions (src/lib/auth-actions.ts) supply the real dependencies.
 */
import { REGIONS } from "../../data/locations.ts";
import { onboardingUrl, safeNext } from "./redirect.ts";

export type AuthFailure =
  | "not-configured"
  | "unavailable"
  | "invalid-number"
  | "captcha"
  | "too-many-attempts"
  | "wrong-or-expired-code"
  | "sms-failed"
  | "not-signed-in"
  | "invalid-details"
  | "email-in-use"
  | "already-registered"
  | "outdated-terms"
  | "network"
  | "unexpected";

export type AuthResult = { ok: true } | { ok: false; reason: AuthFailure; retryAfterSeconds?: number; fields?: Record<string, string> };

export const AUTH_MESSAGES: Record<AuthFailure, string> = {
  "not-configured": "Mobile sign-in is not connected on this site yet, so no code was sent and no account was created.",
  unavailable: "Sign-in is temporarily unavailable. Please try again in a few minutes.",
  "invalid-number": "Enter a 10-digit Indian mobile number.",
  captcha: "The security check did not pass. Complete it again and retry.",
  "too-many-attempts": "Too many code requests. Please wait before trying again.",
  "wrong-or-expired-code": "That code is wrong or has expired. Check the message or request a new code.",
  "sms-failed": "We could not send the text message. Check the number and try again.",
  "not-signed-in": "Your session has ended. Sign in again to continue.",
  "invalid-details": "Some details need fixing. Check the highlighted fields.",
  "email-in-use": "That email address is already used by another account.",
  "already-registered": "This mobile number already has an account, so you have been signed in.",
  "outdated-terms": "Our terms or privacy notice changed while you were signing up. Review them and submit again.",
  network: "We could not reach the server. Check your connection and try again.",
  unexpected: "Something went wrong. Please try again.",
};

/** Ten-digit Indian mobile number, with or without +91 / 0 in front. */
export function normaliseMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export const toE164 = (tenDigits: string) => `+91${tenDigits}`;

export function isEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.trim()) && input.trim().length <= 254;
}

type AuthErrorLike = { code?: string; status?: number; message?: string; name?: string } | null | undefined;

/** Maps Supabase Auth errors to messages that reveal nothing about whether an account exists. */
export function mapAuthError(error: AuthErrorLike): AuthFailure {
  if (!error) return "unexpected";
  switch (error.code) {
    case "captcha_failed":
      return "captcha";
    case "over_sms_send_rate_limit":
    case "over_request_rate_limit":
      return "too-many-attempts";
    case "otp_expired":
    case "otp_disabled":
      return "wrong-or-expired-code";
    case "sms_send_failed":
      return "sms-failed";
    case "phone_provider_disabled":
    case "provider_disabled":
    case "signup_disabled":
    case "anonymous_provider_disabled":
      return "not-configured";
    case "validation_failed":
      return "invalid-number";
    case "request_timeout":
    case "hook_timeout":
    case "hook_timeout_after_retry":
      return "unavailable";
  }
  if (error.name === "AuthRetryableFetchError" || error.status === 0) return "network";
  if (error.status === 429) return "too-many-attempts";
  return "unexpected";
}

// ---------------------------------------------------------------------------------------------
// Request a code
// ---------------------------------------------------------------------------------------------

type DbError = { code?: string; message: string } | null;

export type RequestOtpDeps = {
  limiterToken: string | null;
  clientIp: string;
  captchaRequired: boolean;
  consumeQuota(token: string, phone: string, ip: string): Promise<{ data: { allowed: boolean; reason: string | null; retry_after_seconds: number }[] | null; error: DbError }>;
  refundQuota(token: string, phone: string): Promise<{ error: DbError }>;
  sendOtp(phone: string, captchaToken: string | undefined): Promise<{ error: AuthErrorLike }>;
};

export async function requestOtpCore(deps: RequestOtpDeps, input: { mobile: string; captchaToken?: string }): Promise<AuthResult> {
  const ten = normaliseMobile(input.mobile ?? "");
  if (!ten) return { ok: false, reason: "invalid-number" };
  const captchaToken = input.captchaToken?.trim() || undefined;
  if (deps.captchaRequired && !captchaToken) return { ok: false, reason: "captcha" };
  if (!deps.limiterToken) return { ok: false, reason: "unavailable" }; // fail closed
  const phone = toE164(ten);

  const quota = await deps.consumeQuota(deps.limiterToken, phone, deps.clientIp);
  if (quota.error) return { ok: false, reason: "unavailable" };
  const row = quota.data?.[0];
  if (!row) return { ok: false, reason: "unavailable" };
  if (!row.allowed) return { ok: false, reason: "too-many-attempts", retryAfterSeconds: row.retry_after_seconds };

  const { error } = await deps.sendOtp(phone, captchaToken);
  if (!error) return { ok: true };
  const reason = mapAuthError(error);
  if (reason === "captcha") {
    // Supabase refused before sending anything: give the number its attempt back (decision D3-1).
    await deps.refundQuota(deps.limiterToken, phone);
  }
  return { ok: false, reason };
}

// ---------------------------------------------------------------------------------------------
// Verify a code
// ---------------------------------------------------------------------------------------------

export type VerifyOtpDeps = {
  verify(phone: string, code: string): Promise<{ error: AuthErrorLike }>;
  loadProfile(): Promise<{ onboarded: boolean; status: string } | null>;
};

export type VerifyResult = { ok: true; onboarded: boolean; redirectTo: string } | { ok: false; reason: AuthFailure };

export async function verifyOtpCore(deps: VerifyOtpDeps, input: { mobile: string; code: string; next?: string }): Promise<VerifyResult> {
  const ten = normaliseMobile(input.mobile ?? "");
  if (!ten) return { ok: false, reason: "invalid-number" };
  if (!/^\d{6}$/.test(input.code ?? "")) return { ok: false, reason: "wrong-or-expired-code" };
  const { error } = await deps.verify(toE164(ten), input.code);
  if (error) return { ok: false, reason: mapAuthError(error) };
  const profile = await deps.loadProfile();
  if (profile?.onboarded) {
    return { ok: true, onboarded: true, redirectTo: profile.status === "active" ? safeNext(input.next) : "/account" };
  }
  return { ok: true, onboarded: false, redirectTo: onboardingUrl(input.next) };
}

// ---------------------------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------------------------

export type OnboardingInput = {
  name: string;
  email: string;
  state: string;
  city: string;
  condition?: string;
  adult: boolean;
  consent: boolean;
};

export type ValidOnboarding = { name: string; email: string; state: string; city: string; condition: "new" | "used" | null };

export function validateOnboarding(input: OnboardingInput): { ok: true; value: ValidOnboarding } | { ok: false; fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  const name = (input.name ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 100) fields.name = "Enter your full name.";
  const email = (input.email ?? "").trim();
  if (!isEmail(email)) fields.email = "Enter a valid email address, like name@example.com.";
  const region = REGIONS.find((r) => r.code === input.state);
  if (!region) fields.state = "Choose your state.";
  else if (!region.cities.includes(input.city)) fields.city = "Choose your city.";
  const condition = input.condition === "new" || input.condition === "used" ? input.condition : null;
  if (input.condition && !condition) fields.condition = "Choose new, used or either.";
  if (input.adult !== true) fields.adult = "You must be 18 or older to create an account.";
  if (input.consent !== true) fields.consent = "Tick the box to agree before continuing.";
  if (Object.keys(fields).length) return { ok: false, fields };
  return { ok: true, value: { name, email, state: input.state, city: input.city, condition } };
}

export type OnboardDeps = {
  signedIn: boolean;
  currentDocuments(): Promise<{ privacy: string | null; terms: string | null }>;
  complete(args: {
    p_full_name: string;
    p_email: string;
    p_state_code: string;
    p_city_name: string;
    p_condition_pref: string | null;
    p_is_adult_declared: boolean;
    p_privacy_document_id: string;
    p_terms_document_id: string;
    p_channel: "web";
    p_context: string;
  }): Promise<{ error: DbError }>;
};

export async function onboardCore(deps: OnboardDeps, input: OnboardingInput, context: string): Promise<AuthResult> {
  if (!deps.signedIn) return { ok: false, reason: "not-signed-in" };
  const v = validateOnboarding(input);
  if (!v.ok) return { ok: false, reason: "invalid-details", fields: v.fields };
  const docs = await deps.currentDocuments();
  if (!docs.privacy || !docs.terms) return { ok: false, reason: "unavailable" };
  const { error } = await deps.complete({
    p_full_name: v.value.name,
    p_email: v.value.email,
    p_state_code: v.value.state,
    p_city_name: v.value.city,
    p_condition_pref: v.value.condition,
    p_is_adult_declared: true,
    p_privacy_document_id: docs.privacy,
    p_terms_document_id: docs.terms,
    p_channel: "web",
    p_context: context.slice(0, 60),
  });
  if (!error) return { ok: true };
  if (error.code === "23505") {
    return /email/i.test(error.message) ? { ok: false, reason: "email-in-use", fields: { email: AUTH_MESSAGES["email-in-use"] } } : { ok: false, reason: "already-registered" };
  }
  if (error.code === "22023" && /legal document/i.test(error.message)) return { ok: false, reason: "outdated-terms" };
  if (error.code === "42501") return { ok: false, reason: "not-signed-in" };
  if (error.code === "22023" || error.code === "23514") return { ok: false, reason: "invalid-details", fields: {} };
  return { ok: false, reason: "unexpected" };
}

/** Client address for per-IP limits. On Vercel, x-forwarded-for is set by the platform. */
export function clientIpFrom(get: (name: string) => string | null): string {
  const real = get("x-real-ip")?.trim();
  const fwd = get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = real || fwd || "unknown";
  return ip.slice(0, 64);
}
