"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { REGIONS } from "@/data/locations";
import { AUTH_MESSAGES } from "@/lib/auth";
import { completeOnboarding } from "@/lib/auth-actions";

const SORTED = [...REGIONS].sort((a, b) => a.name.localeCompare(b.name));
const field = "h-12 w-full rounded-xl bg-void px-4 text-base text-bright ring-1 ring-hairline-strong outline-none focus:ring-2 focus:ring-ember aria-[invalid=true]:ring-danger";

/** First sign-in: the details needed before offers can be shown. Prefilled from Google where possible. */
export function OnboardingForm({ next, defaults }: { next?: string; defaults: { name: string; email: string } }) {
  const router = useRouter();
  const [f, setF] = useState({ name: defaults.name, email: defaults.email, mobile: "", state: "", city: "", adult: false, consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const region = SORTED.find((r) => r.code === f.state);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await completeOnboarding(f, "onboarding");
    setBusy(false);
    if (res.ok || res.reason === "already-registered") {
      router.replace(next ?? "/explore");
      return router.refresh();
    }
    setErrors({ ...(res.fields ?? {}), form: AUTH_MESSAGES[res.reason] });
  }

  const err = (k: string) =>
    errors[k] ? (
      <p role="alert" className="text-sm text-danger">
        {errors[k]}
      </p>
    ) : null;

  return (
    <form onSubmit={submit} noValidate className="surface flex flex-col gap-5 rounded-3xl p-6 sm:p-8">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Full name
        <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" aria-invalid={!!errors.name} className={field} />
        {err("name")}
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Email address
        <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" aria-invalid={!!errors.email} className={field} />
        {err("email")}
        {defaults.email && f.email.trim().toLowerCase() !== defaults.email.toLowerCase() && <span className="text-xs font-normal text-ash">A different address from your Google account is saved as unverified.</span>}
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Mobile number <span className="font-normal text-ash">(optional)</span>
        <input value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} inputMode="tel" autoComplete="tel" placeholder="10-digit number" aria-invalid={!!errors.mobile} className={field} />
        <span className="text-xs font-normal text-ash">Not verified yet. Shared with a seller only when you send that seller an enquiry.</span>
        {err("mobile")}
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          State
          <select value={f.state} onChange={(e) => setF({ ...f, state: e.target.value, city: "" })} aria-invalid={!!errors.state} className={field}>
            <option value="">Choose a state</option>
            {SORTED.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
          {err("state")}
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          City
          <select value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} disabled={!region} aria-invalid={!!errors.city} className={field + " disabled:opacity-50"}>
            <option value="">{region ? "Choose a city" : "Choose a state first"}</option>
            {region?.cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {err("city")}
        </label>
      </div>
      <label className="flex items-start gap-3 text-sm text-fog">
        <input type="checkbox" checked={f.adult} onChange={(e) => setF({ ...f, adult: e.target.checked })} className="mt-0.5 h-5 w-5 flex-none accent-ember" />
        <span>I am 18 years of age or older.</span>
      </label>
      {err("adult")}
      <label className="flex items-start gap-3 text-sm text-fog">
        <input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} className="mt-0.5 h-5 w-5 flex-none accent-ember" />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="text-ember underline underline-offset-4">
            Terms and Conditions
          </Link>{" "}
          and to my details being used as described in the{" "}
          <Link href="/privacy" className="text-ember underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      {err("consent")}
      {errors.form && (
        <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">
          {errors.form}
        </p>
      )}
      <button type="submit" disabled={busy} className="min-h-13 rounded-full bg-ember py-3.5 font-semibold text-void transition hover:bg-[#ff8a4a] disabled:opacity-60">
        {busy ? "Saving…" : "Finish creating my account"}
      </button>
    </form>
  );
}
