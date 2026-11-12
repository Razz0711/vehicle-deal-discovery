/**
 * AUTHENTICATION BOUNDARY — NOT CONNECTED.
 *
 * This file is the single seam between the interface and whatever account
 * system is chosen later. Today there is no server, database or SMS
 * provider, so every call reports "not-configured" and nothing a visitor
 * types is sent or stored anywhere.
 *
 * To switch accounts on:
 *   1. Choose an auth backend (for example Supabase Auth, Firebase Auth or
 *      a custom API) with phone OTP enabled and an SMS provider attached
 *      (in India the sender and templates must be DLT-registered).
 *   2. Replace the bodies of requestOtp / verifyOtp / saveProfile with calls
 *      to it. OTPs must be generated, hashed and checked on the server only.
 *   3. Set AUTH.configured to true. The screens already handle every
 *      result below, including duplicate accounts.
 *
 * Do not make these functions "succeed" without a real backend.
 */

export const AUTH = {
  configured: false,
  missing: ["An authentication backend with a user database", "An SMS provider for mobile OTP (DLT-registered sender and template)", "An email provider, if email verification is wanted", "Server-side session handling"],
} as const;

/**
 * ONE account system for everyone. A person signs in the same way whatever
 * they are; what they may do comes from their role. Buyers are the only
 * role with screens today. The seller (dealer or agency) and admin portals
 * are reserved here so they can be added without a second login system or a
 * second copy of the vehicle catalogue.
 */
export type Role = "buyer" | "seller" | "admin";

export const ROLE_HOME: Record<Role, { path: string; built: boolean }> = {
  buyer: { path: "/explore", built: true },
  seller: { path: "/partner", built: false },
  admin: { path: "/admin", built: false },
};

export type AuthFailure = "not-configured" | "invalid-number" | "already-registered" | "wrong-code" | "expired-code" | "too-many-attempts" | "network";
export type AuthResult = { ok: true } | { ok: false; reason: AuthFailure };

/** Fields every account has, whatever its role. */
export type Account = { role: Role; name: string; mobile: string; email: string };
/** What a buyer adds. Seller and admin profiles will be their own types beside this one. */
export type BuyerProfile = Account & { role: "buyer"; state: string; city: string; condition?: "new" | "used" };
export type Profile = BuyerProfile;

export const AUTH_MESSAGES: Record<AuthFailure, string> = {
  "not-configured": "Mobile verification is not connected yet, so no code was sent and no account was created.",
  "invalid-number": "That mobile number could not be used. Check it and try again.",
  "already-registered": "An account already exists for this mobile number. Sign in instead.",
  "wrong-code": "That code is not correct. Check the message and try again.",
  "expired-code": "That code has expired. Request a new one.",
  "too-many-attempts": "Too many attempts. Wait a few minutes before trying again.",
  network: "We could not reach the server. Check your connection and try again.",
};

/* eslint-disable @typescript-eslint/no-unused-vars */
/** Sends a one-time code. The role is never chosen here: it is stored on the account and read after verification. */
export async function requestOtp(mobile: string, intent: "register" | "sign-in"): Promise<AuthResult> {
  return { ok: false, reason: "not-configured" };
}

export async function verifyOtp(mobile: string, code: string): Promise<AuthResult> {
  return { ok: false, reason: "not-configured" };
}

export async function saveProfile(profile: Profile): Promise<AuthResult> {
  return { ok: false, reason: "not-configured" };
}
/* eslint-enable @typescript-eslint/no-unused-vars */

/** Ten-digit Indian mobile number, with or without +91 / 0 in front. */
export function normaliseMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function isEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.trim());
}
