import "server-only";

/**
 * Server-only settings. Importing this file from a Client Component fails the build.
 * OTP_LIMITER_TOKEN is not a Supabase key: it only lets the server count OTP attempts
 * (decision D3-1). It must match the Vault secret `otp_limiter_token` in the same project.
 */
export function otpLimiterToken(): string | null {
  const t = process.env.OTP_LIMITER_TOKEN?.trim();
  return t && t.length >= 32 ? t : null;
}
