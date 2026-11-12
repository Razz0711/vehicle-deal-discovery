"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Info } from "lucide-react";
import { AUTH, AUTH_MESSAGES, normaliseMobile } from "@/lib/auth";
import { requestOtp, verifyOtp } from "@/lib/auth-actions";
import { Turnstile, TURNSTILE_SITE_KEY, type TurnstileHandle } from "./Turnstile";

const input = "h-12 w-full rounded-xl bg-void px-4 text-base text-bright ring-1 ring-hairline-strong outline-none focus:ring-2 focus:ring-ember aria-[invalid=true]:ring-danger";

function waitText(seconds?: number) {
  if (!seconds) return "";
  return seconds > 3600 ? " You can try again tomorrow." : ` Try again in about ${Math.ceil(seconds / 60)} minute${seconds > 60 ? "s" : ""}.`;
}

export function SignInForm({ next }: { next?: string }) {
  const router = useRouter();
  const captcha = useRef<TurnstileHandle>(null);
  const [stage, setStage] = useState<"mobile" | "code">("mobile");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const m = normaliseMobile(mobile);
    if (!m) return setError(AUTH_MESSAGES["invalid-number"]);
    if (TURNSTILE_SITE_KEY && !token) return setError("Complete the security check first.");
    setError("");
    setBusy(true);
    const res = await requestOtp(m, token ?? undefined);
    setBusy(false);
    captcha.current?.reset(); // tokens are single-use
    if (res.ok) {
      setCode("");
      setStage("code");
    } else setError(AUTH_MESSAGES[res.reason] + (res.reason === "too-many-attempts" ? waitText(res.retryAfterSeconds) : ""));
  }

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code from the message.");
    setError("");
    setBusy(true);
    const res = await verifyOtp(normaliseMobile(mobile)!, code, next);
    if (!res.ok) {
      setBusy(false);
      return setError(AUTH_MESSAGES[res.reason]);
    }
    router.replace(res.redirectTo);
    router.refresh();
  }

  if (!AUTH.configured) {
    return (
      <div className="surface flex flex-col gap-4 rounded-3xl p-6 sm:p-8">
        <p role="note" className="flex gap-3 rounded-xl bg-ember-soft p-3.5 text-sm ring-1 ring-ember/30">
          <Info size={18} aria-hidden className="mt-0.5 flex-none text-ember" />
          <span>{AUTH_MESSAGES["not-configured"]}</span>
        </p>
        <Link href="/explore" className="text-center font-medium text-ember underline underline-offset-4">
          Explore as a guest
        </Link>
      </div>
    );
  }

  return stage === "mobile" ? (
    <form onSubmit={send} noValidate className="surface flex flex-col gap-5 rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="signin-mobile" className="text-sm font-medium">
          Mobile number
        </label>
        <input id="signin-mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="10-digit number" aria-invalid={!!error} aria-describedby={error ? "signin-error" : undefined} className={input} />
      </div>
      <Turnstile ref={captcha} onToken={setToken} />
      {error && (
        <p id="signin-error" role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="min-h-13 rounded-full bg-ember py-3.5 font-semibold text-void transition hover:bg-[#ff8a4a] disabled:opacity-60">
        {busy ? "Sending…" : "Send one-time code"}
      </button>
      <p className="text-center text-sm text-fog">
        New here?{" "}
        <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="text-ember underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  ) : (
    <form onSubmit={check} noValidate className="surface flex flex-col gap-5 rounded-3xl p-6 sm:p-8">
      <p className="text-sm text-fog">We sent a 6-digit code to the number ending {normaliseMobile(mobile)?.slice(-4)}.</p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="signin-code" className="text-sm font-medium">
          One-time code
        </label>
        <input id="signin-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" aria-invalid={!!error} aria-describedby={error ? "signin-error" : undefined} className={input + " tnum tracking-[0.4em]"} />
      </div>
      {error && (
        <p id="signin-error" role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="min-h-13 rounded-full bg-ember py-3.5 font-semibold text-void transition hover:bg-[#ff8a4a] disabled:opacity-60">
        {busy ? "Verifying…" : "Verify and sign in"}
      </button>
      <button
        type="button"
        onClick={() => {
          setStage("mobile");
          setError("");
        }}
        className="min-h-11 text-sm text-fog hover:text-bright"
      >
        Use a different number or get a new code
      </button>
    </form>
  );
}
