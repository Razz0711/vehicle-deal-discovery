import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { areaFor } from "@/lib/auth/access";
import { signInUrl } from "@/lib/auth/redirect";

const NO_STORE = "private, no-store";

/**
 * Runs before every matched request:
 * 1. refreshes the Supabase session cookie (getClaims() verifies the JWT and refreshes if needed);
 * 2. for protected areas, sends signed-out visitors to /signin?next=… (an optimistic check: each
 *    protected page repeats the full check on the server);
 * 3. marks protected and signed-in responses `Cache-Control: private, no-store`.
 */
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const area = areaFor(request.nextUrl.pathname);

  let response = NextResponse.next({ request });
  if (!url || !key) {
    if (area) response.headers.set("Cache-Control", NO_STORE);
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Nothing may run between createServerClient and getClaims (Supabase guidance).
  let claims: Record<string, unknown> | null = null;
  try {
    const { data } = await supabase.auth.getClaims();
    claims = (data?.claims as Record<string, unknown> | undefined) ?? null;
  } catch {
    claims = null; // unverifiable or unreachable: treat as signed out
  }

  const signedIn = !!claims?.sub && claims.is_anonymous !== true;
  if (area && !signedIn) {
    const target = request.nextUrl.pathname + request.nextUrl.search;
    const redirect = NextResponse.redirect(new URL(signInUrl(area === "onboarding" ? undefined : target), request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c)); // keep any cookie changes (e.g. cleared session)
    redirect.headers.set("Cache-Control", NO_STORE);
    return redirect;
  }
  if (area || signedIn) response.headers.set("Cache-Control", NO_STORE);
  return response;
}
