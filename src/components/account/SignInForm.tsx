"use client";

import Link from "next/link";
import { useState } from "react";
import { AUTH_MESSAGES, normaliseMobile, requestOtp } from "@/lib/auth";

export function SignInForm() {
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNotice("");
    const m = normaliseMobile(mobile);
    if (!m) return setError("Enter a 10-digit Indian mobile number.");
    setError("");
    setBusy(true);
    const res = await requestOtp(m, "sign-in");
    setBusy(false);
    // When a backend is connected, a successful request moves on to code entry here.
    setNotice(res.ok ? "A code has been sent to your mobile." : AUTH_MESSAGES[res.reason]);
  }

  return (
    <form onSubmit={submit} noValidate className="surface flex flex-col gap-5 rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="signin-mobile" className="text-sm font-medium">
          Mobile number
        </label>
        <input
          id="signin-mobile"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
          placeholder="10-digit number"
          aria-invalid={!!error}
          aria-describedby={error ? "signin-error" : undefined}
          className="h-12 w-full rounded-xl bg-void px-4 text-base text-bright ring-1 ring-hairline-strong outline-none focus:ring-2 focus:ring-ember"
        />
        {error && (
          <p id="signin-error" role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
      <button type="submit" disabled={busy} className="min-h-13 rounded-full bg-ember py-3.5 font-semibold text-void transition hover:bg-[#ff8a4a] disabled:opacity-60">
        {busy ? "Checking…" : "Send one-time code"}
      </button>
      <div aria-live="polite">
        {notice && (
          <p className="rounded-xl bg-ember-soft p-3.5 text-sm ring-1 ring-ember/30">
            {notice}{" "}
            <Link href="/explore" className="font-medium text-ember underline underline-offset-4">
              Explore as a guest
            </Link>
          </p>
        )}
      </div>
      <p className="text-center text-sm text-fog">
        New here?{" "}
        <Link href="/register" className="text-ember underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
