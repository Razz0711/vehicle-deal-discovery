"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

/** Browser client: publishable key only. Used for display (e.g. signed-in state), never for authorisation. */
export function createClient() {
  const env = publicEnv();
  return createBrowserClient(env.supabaseUrl, env.supabasePublishableKey);
}
