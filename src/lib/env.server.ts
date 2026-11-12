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

/**
 * This site's public origin, used as the OAuth return address. Supabase only redirects to
 * addresses on its allow list, so a wrong value fails closed.
 * SITE_URL (explicit) > VERCEL_URL (set by Vercel per deployment) > local development.
 */
export function siteOrigin(): string {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return new URL(explicit).origin;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
