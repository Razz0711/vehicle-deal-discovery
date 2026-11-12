/**
 * AUTHENTICATION BOUNDARY (client-safe part).
 *
 * One account system for everyone: buyers, sellers and staff sign in the same way, with a
 * phone one-time code through Supabase Auth. What a person may do is decided on the server
 * from database tables (profiles now; organisation membership and staff grants from Phase 6),
 * never from anything the browser sends.
 *
 * - Server actions: src/lib/auth-actions.ts (requestOtp, verifyOtp, completeOnboarding, signOut)
 * - Pure logic and messages: src/lib/auth/core.ts
 * - Route access rules: src/lib/auth/access.ts, enforced in pages via src/lib/auth/session.ts
 */
import { SUPABASE_CONFIGURED } from "./supabase/config";

export const AUTH = {
  configured: SUPABASE_CONFIGURED,
  missing: ["Supabase project URL and publishable key (see docs/STAGING.md)"],
} as const;

export type Role = "buyer" | "seller" | "admin";

export const ROLE_HOME: Record<Role, { path: string; built: boolean }> = {
  buyer: { path: "/explore", built: true },
  seller: { path: "/partner", built: false },
  admin: { path: "/admin", built: false },
};

/** Fields every account has, whatever its role. */
export type Account = { role: Role; name: string; mobile: string; email: string };
export type BuyerProfile = Account & { role: "buyer"; state: string; city: string; condition?: "new" | "used" };
export type Profile = BuyerProfile;

export { AUTH_MESSAGES, isEmail, normaliseMobile, type AuthFailure, type AuthResult } from "./auth/core";
