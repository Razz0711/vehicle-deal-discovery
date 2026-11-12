/**
 * Public (browser-safe) environment configuration.
 *
 * Only values that are safe to ship to every visitor belong here. Next.js inlines
 * `NEXT_PUBLIC_*` variables into the client bundle at build time, so each one must
 * be read with a literal `process.env.NEXT_PUBLIC_…` expression (no dynamic keys).
 *
 * The Supabase secret key (`sb_secret_…`) and the legacy `service_role` JWT must
 * never appear in this app. `parsePublicEnv` refuses to start if one is supplied
 * where the publishable key belongs.
 */

export type AppEnv = "local" | "staging" | "production";

export type PublicEnv = {
  appEnv: AppEnv;
  supabaseUrl: string;
  supabasePublishableKey: string;
  /** Cloudflare Turnstile site key. Used by phone sign-in, which is paused (D3-13), so optional. */
  turnstileSiteKey: string | null;
};

export type RawPublicEnv = {
  NEXT_PUBLIC_APP_ENV?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string;
};

export class EnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvError";
  }
}

const APP_ENVS: readonly AppEnv[] = ["local", "staging", "production"];

/** True when a key is privileged and must never reach a browser. */
export function isPrivilegedKey(key: string): boolean {
  if (key.startsWith("sb_secret_")) return true;
  const parts = key.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as {
      role?: unknown;
    };
    return payload.role === "service_role";
  } catch {
    return false;
  }
}

function requireValue(name: string, value: string | undefined): string {
  const v = value?.trim();
  if (!v) throw new EnvError(`${name} is not set. Copy .env.example to .env.local and fill it in.`);
  return v;
}

export function parsePublicEnv(raw: RawPublicEnv): PublicEnv {
  const appEnvRaw = raw.NEXT_PUBLIC_APP_ENV?.trim() || "local";
  if (!APP_ENVS.includes(appEnvRaw as AppEnv)) {
    throw new EnvError(`NEXT_PUBLIC_APP_ENV must be one of ${APP_ENVS.join(", ")}.`);
  }
  const appEnv = appEnvRaw as AppEnv;

  const supabaseUrl = requireValue("NEXT_PUBLIC_SUPABASE_URL", raw.NEXT_PUBLIC_SUPABASE_URL);
  let url: URL;
  try {
    url = new URL(supabaseUrl);
  } catch {
    throw new EnvError("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
  }
  const isLoopback = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(appEnv === "local" && isLoopback)) {
    throw new EnvError("NEXT_PUBLIC_SUPABASE_URL must use https outside the local stack.");
  }

  const supabasePublishableKey = requireValue(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    raw.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  if (isPrivilegedKey(supabasePublishableKey)) {
    throw new EnvError(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY holds a secret/service_role key. Use the publishable key; the secret key never belongs in this app.",
    );
  }

  // Required again when phone sign-in returns: CAPTCHA protects code requests (D3-13).
  const turnstileSiteKey = raw.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null;

  return { appEnv, supabaseUrl: url.origin, supabasePublishableKey, turnstileSiteKey };
}

let cached: PublicEnv | null = null;

/** Validated public env. Throws `EnvError` with a clear message when misconfigured. */
export function publicEnv(): PublicEnv {
  cached ??= parsePublicEnv({
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  });
  return cached;
}
