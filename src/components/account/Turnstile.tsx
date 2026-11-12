"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

type TurnstileApi = {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileHandle = { reset(): void };

/** Public Turnstile site key. Absent locally, where Supabase CAPTCHA is off. */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null;

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loader: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  loader ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loader = null;
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(s);
  });
  return loader;
}

/**
 * Cloudflare Turnstile widget. The token it produces is passed to Supabase Auth, which verifies
 * it server-side; this component never decides anything itself. Tokens are single-use, so the
 * parent calls reset() after every code request.
 */
export function Turnstile({ onToken, ref }: { onToken: (token: string | null) => void; ref?: Ref<TurnstileHandle> }) {
  const box = useRef<HTMLDivElement>(null);
  const id = useRef<string | null>(null);
  const cb = useRef(onToken);

  useEffect(() => {
    cb.current = onToken;
  }, [onToken]);

  useImperativeHandle(ref, () => ({
    reset() {
      cb.current(null);
      if (id.current && window.turnstile) window.turnstile.reset(id.current);
    },
  }));

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile || id.current) return;
        id.current = window.turnstile.render(box.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action: "otp",
          theme: "dark",
          callback: (t: string) => cb.current(t),
          "expired-callback": () => cb.current(null),
          "error-callback": () => cb.current(null),
        });
      })
      .catch(() => cb.current(null));
    return () => {
      cancelled = true;
      if (id.current && window.turnstile) window.turnstile.remove(id.current);
      id.current = null;
    };
  }, []);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={box} className="min-h-[65px]" aria-label="Security check" />;
}
