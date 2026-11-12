/**
 * Who may open which protected area. Pure, so it is unit-tested; pages call it with state
 * read on the server (getClaims + the person's own profile row). Never trusts client roles.
 */
import { onboardingUrl, safeNext, signInUrl } from "./redirect.ts";

export type Area = "buyer" | "partner" | "admin" | "onboarding" | "account";

export type AuthState =
  | { configured: false }
  | {
      configured: true;
      user: null | { id: string; anonymous: boolean; aal: string | null };
      profile: null | { onboarded: boolean; status: string };
    };

export type Decision =
  | { action: "allow" }
  | { action: "redirect"; to: string }
  | { action: "deny"; reason: "suspended" | "mfa-required" | "no-staff-access" | "no-seller-access" };

/** Protected path prefixes, used by proxy.ts for the optimistic (cookie-only) check. */
export const PROTECTED_PREFIXES: Record<string, Area> = {
  "/deals": "buyer",
  "/partner": "partner",
  "/admin": "admin",
  "/onboarding": "onboarding",
  "/account": "account",
};

export function areaFor(pathname: string): Area | null {
  for (const [prefix, area] of Object.entries(PROTECTED_PREFIXES)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return area;
  }
  return null;
}

export function decideAccess(state: AuthState, area: Area, nextPath: string): Decision {
  if (!state.configured || !state.user || state.user.anonymous) {
    return { action: "redirect", to: signInUrl(area === "onboarding" ? undefined : nextPath) };
  }
  if (area === "account") return { action: "allow" };

  const onboarded = !!state.profile?.onboarded;
  if (area === "onboarding") {
    return onboarded ? { action: "redirect", to: safeNext(nextPath) } : { action: "allow" };
  }
  if (!onboarded) return { action: "redirect", to: onboardingUrl(nextPath) };
  if (state.profile?.status !== "active") return { action: "deny", reason: "suspended" };

  if (area === "buyer") return { action: "allow" };
  if (area === "partner") {
    // organization_members arrives in Phase 6 (decision D3-8). Until then the portal shows only
    // a "not open yet" notice, and the membership check below has nothing to grant.
    return { action: "allow" };
  }
  // admin: two-step sign-in first, then a staff grant. No grant table exists before Phase 6,
  // so every request is refused (fail closed).
  if (state.user.aal !== "aal2") return { action: "deny", reason: "mfa-required" };
  return { action: "deny", reason: "no-staff-access" };
}
