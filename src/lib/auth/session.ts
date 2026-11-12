import "server-only";
import { redirect } from "next/navigation";
import { SUPABASE_CONFIGURED } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { decideAccess, type Area, type AuthState, type Decision } from "./access";

export type SessionInfo = {
  state: AuthState;
  phone: string | null;
  name: string | null;
};

/**
 * Reads the session on the server with getClaims() (verified JWT, never getSession()) and the
 * person's own profile row through RLS. Nothing here trusts role information from the client.
 */
export async function readSession(): Promise<SessionInfo> {
  if (!SUPABASE_CONFIGURED) return { state: { configured: false }, phone: null, name: null };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { state: { configured: true, user: null, profile: null }, phone: null, name: null };
  const { data: profile } = await supabase.from("profiles").select("full_name, onboarded_at, status").maybeSingle();
  return {
    state: {
      configured: true,
      user: { id: claims.sub, anonymous: claims.is_anonymous === true, aal: typeof claims.aal === "string" ? claims.aal : null },
      profile: profile ? { onboarded: !!profile.onboarded_at, status: profile.status } : null,
    },
    phone: typeof claims.phone === "string" && claims.phone ? claims.phone : null,
    name: profile?.full_name ?? null,
  };
}

/** Enforces access for a protected page. Redirects, or returns the decision for "deny" screens. */
export async function guard(area: Area, nextPath: string): Promise<{ session: SessionInfo; decision: Decision }> {
  const session = await readSession();
  const decision = decideAccess(session.state, area, nextPath);
  if (decision.action === "redirect") redirect(decision.to);
  return { session, decision };
}
