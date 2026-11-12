/**
 * Safe post-sign-in redirects (architecture section 8.5): only known relative routes.
 * Anything else, including absolute URLs, protocol-relative URLs, backslash tricks,
 * encoded slashes, control characters and unknown paths, falls back to /explore.
 */

const ALLOWED_PATHS = new Set(["/", "/explore", "/state", "/city", "/condition", "/brand", "/model", "/deals", "/partner", "/admin", "/account"]);
const BASE = "https://dealfinder.invalid";

export const DEFAULT_AFTER_SIGN_IN = "/explore";

export function safeNext(raw: unknown, fallback: string = DEFAULT_AFTER_SIGN_IN): string {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  // Backslashes and control characters are never part of a legitimate route.
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return fallback;
  let url: URL;
  try {
    url = new URL(raw, BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== BASE) return fallback;
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
  if (!ALLOWED_PATHS.has(path)) return fallback;
  return path + url.search;
}

/** Sign-in URL that returns the person to `next` afterwards (if `next` is safe). */
export function signInUrl(next?: string): string {
  const target = next ? safeNext(next, "") : "";
  return target ? `/signin?next=${encodeURIComponent(target)}` : "/signin";
}

export function onboardingUrl(next?: string): string {
  const target = next ? safeNext(next, "") : "";
  return target ? `/onboarding?next=${encodeURIComponent(target)}` : "/onboarding";
}
