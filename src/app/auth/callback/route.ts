import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_CONFIGURED } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { afterSignIn } from "@/lib/auth/core";
import { safeNext } from "@/lib/auth/redirect";

/**
 * OAuth return address. Exchanges the one-time code (with the PKCE verifier cookie) for a
 * session cookie, then sends the person onward. Always redirects to a path on this site.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNext(params.get("next"), "") || undefined;
  const fail = (reason: string) => {
    const url = new URL("/signin", request.nextUrl.origin);
    url.searchParams.set("error", reason);
    if (next) url.searchParams.set("next", next);
    const res = NextResponse.redirect(url);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  };

  if (!SUPABASE_CONFIGURED) return fail("not-configured");
  if (params.get("error")) return fail(params.get("error") === "access_denied" ? "cancelled" : "oauth");
  const code = params.get("code");
  if (!code) return fail("oauth");

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail("oauth");

  const { data } = await supabase.from("profiles").select("onboarded_at, status").maybeSingle();
  const target = afterSignIn(data ? { onboarded: !!data.onboarded_at, status: data.status } : null, next);
  const res = NextResponse.redirect(new URL(target, request.nextUrl.origin));
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
