"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Info, ShieldAlert } from "lucide-react";
import { REGIONS } from "@/data/locations";
import { AUTH, AUTH_MESSAGES, isEmail, normaliseMobile, requestOtp, saveProfile, verifyOtp, type AuthFailure } from "@/lib/auth";
import { hrefFor } from "@/lib/selection";
import { slug } from "@/lib/slug";

type Stage = "details" | "code" | "blocked" | "prefs";
type Fields = { name: string; mobile: string; email: string; state: string; city: string; consent: boolean };
type Errors = Partial<Record<keyof Fields | "code" | "form", string>>;

const SORTED = [...REGIONS].sort((a, b) => a.name.localeCompare(b.name));
const field = "h-12 w-full rounded-xl bg-void px-4 text-base text-bright ring-1 ring-hairline-strong outline-none transition focus:ring-2 focus:ring-ember aria-[invalid=true]:ring-danger";
const STAGES = ["Your details", "Verify mobile", "Preferences"];

function Field({ id, label, why, error, children }: { id: string; label: string; why: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={id + "-error"} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : (
        <p id={id + "-why"} className="text-xs text-ash">
          {why}
        </p>
      )}
    </div>
  );
}

export function RegisterFlow() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("details");
  const [f, setF] = useState<Fields>({ name: "", mobile: "", email: "", state: "", city: "", consent: false });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [condition, setCondition] = useState<"new" | "used" | "">("");
  const [guest, setGuest] = useState(false);

  const region = SORTED.find((r) => r.code === f.state);
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setF((prev) => ({ ...prev, [k]: v, ...(k === "state" ? { city: "" } : {}) }));
  const fail = (reason: AuthFailure) => setErrors({ form: AUTH_MESSAGES[reason] });
  const stageIndex = stage === "details" ? 0 : stage === "prefs" ? 2 : 1;

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    const found: Errors = {};
    if (f.name.trim().length < 2) found.name = "Enter your full name.";
    const mobile = normaliseMobile(f.mobile);
    if (!mobile) found.mobile = "Enter a 10-digit Indian mobile number.";
    if (!isEmail(f.email)) found.email = "Enter a valid email address, like name@example.com.";
    if (!f.state) found.state = "Choose your state.";
    if (!f.city) found.city = "Choose your city.";
    if (!f.consent) found.consent = "Tick the box to agree before continuing.";
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById("reg-" + Object.keys(found)[0])?.focus();
      return;
    }
    setBusy(true);
    const res = await requestOtp(mobile!, "register");
    setBusy(false);
    if (res.ok) setStage("code");
    else if (res.reason === "not-configured") setStage("blocked");
    else fail(res.reason);
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setErrors({ code: "Enter the 6-digit code from the message." });
    setBusy(true);
    const res = await verifyOtp(normaliseMobile(f.mobile)!, code);
    setBusy(false);
    if (res.ok) {
      setErrors({});
      setStage("prefs");
    } else setErrors({ code: AUTH_MESSAGES[res.reason] });
  }

  async function finish(withPrefs: boolean) {
    const chosen = withPrefs && condition ? condition : undefined;
    if (!guest && AUTH.configured) {
      setBusy(true);
      const res = await saveProfile({ role: "buyer", name: f.name.trim(), mobile: normaliseMobile(f.mobile)!, email: f.email.trim(), state: f.state, city: f.city, condition: chosen });
      setBusy(false);
      if (!res.ok) return fail(res.reason);
    }
    router.push(hrefFor("/explore", withPrefs ? { state: f.state || undefined, city: f.city ? slug(f.city) : undefined, condition: chosen } : {}));
  }

  return (
    <div className="surface rounded-3xl p-6 sm:p-8">
      <ol className="flex items-center gap-2 text-sm" aria-label="Sign-up progress">
        {STAGES.map((s, i) => (
          <li key={s} aria-current={i === stageIndex ? "step" : undefined} className={`flex items-center gap-2 ${i === stageIndex ? "text-bright" : "text-ash"}`}>
            <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-semibold ${i < stageIndex ? "bg-white/12 text-bright" : i === stageIndex ? "bg-ember text-void" : "bg-white/[0.05]"}`}>
              {i < stageIndex ? <Check size={13} strokeWidth={3} aria-hidden /> : i + 1}
            </span>
            <span className={i === stageIndex ? "font-medium" : "hidden sm:inline"}>{s}</span>
            {i < STAGES.length - 1 && <span aria-hidden className="mx-1 h-px w-5 bg-hairline-strong sm:w-8" />}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={stage} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }} className="mt-7">
          {stage === "details" && (
            <form onSubmit={submitDetails} noValidate className="flex flex-col gap-5">
              <div>
                <h2 className="display text-2xl font-bold">Create your account</h2>
                <p className="mt-1.5 text-sm text-fog">Five details, each with a reason. Nothing else is asked for.</p>
              </div>
              {!AUTH.configured && (
                <p role="note" className="flex gap-3 rounded-xl bg-ember-soft p-3.5 text-sm ring-1 ring-ember/30">
                  <Info size={18} aria-hidden className="mt-0.5 flex-none text-ember" />
                  <span>
                    <strong>Preview.</strong> Accounts are not switched on yet. You can try the form, but nothing you type is sent or stored.{" "}
                    <Link href="/explore" className="font-medium text-ember underline underline-offset-4">
                      Skip and explore as a guest
                    </Link>
                  </span>
                </p>
              )}
              <Field id="reg-name" label="Full name" why="So sellers you choose to contact know who is asking." error={errors.name}>
                <input id="reg-name" value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "reg-name-error" : "reg-name-why"} className={field} />
              </Field>
              <Field id="reg-mobile" label="Mobile number" why="Used to verify it is you with a one-time code, and as your sign-in." error={errors.mobile}>
                <input id="reg-mobile" value={f.mobile} onChange={(e) => set("mobile", e.target.value)} inputMode="tel" autoComplete="tel" placeholder="10-digit number" aria-invalid={!!errors.mobile} aria-describedby={errors.mobile ? "reg-mobile-error" : "reg-mobile-why"} className={field} />
              </Field>
              <Field id="reg-email" label="Email address" why="For receipts of enquiries you send and for account recovery." error={errors.email}>
                <input id="reg-email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "reg-email-error" : "reg-email-why"} className={field} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="reg-state" label="State" why="Road tax and registration depend on it." error={errors.state}>
                  <select id="reg-state" value={f.state} onChange={(e) => set("state", e.target.value)} autoComplete="address-level1" aria-invalid={!!errors.state} aria-describedby={errors.state ? "reg-state-error" : "reg-state-why"} className={field}>
                    <option value="">Choose a state</option>
                    {SORTED.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="reg-city" label="City" why="Offers are compared within your city." error={errors.city}>
                  <select id="reg-city" value={f.city} onChange={(e) => set("city", e.target.value)} disabled={!region} autoComplete="address-level2" aria-invalid={!!errors.city} aria-describedby={errors.city ? "reg-city-error" : "reg-city-why"} className={field + " disabled:opacity-50"}>
                    <option value="">{region ? "Choose a city" : "Choose a state first"}</option>
                    {region?.cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div>
                <label className="flex cursor-pointer items-start gap-3 text-sm text-fog">
                  <input id="reg-consent" type="checkbox" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} aria-invalid={!!errors.consent} className="mt-0.5 h-5 w-5 flex-none accent-ember" />
                  <span>
                    I agree to the{" "}
                    <Link href="/terms" className="text-ember underline underline-offset-4">
                      Terms and Conditions
                    </Link>{" "}
                    and to my details being used as described in the{" "}
                    <Link href="/privacy" className="text-ember underline underline-offset-4">
                      Privacy Policy
                    </Link>
                    . My details are shared with a seller only when I send that seller an enquiry.
                  </span>
                </label>
                {errors.consent && (
                  <p role="alert" className="mt-1.5 text-sm text-danger">
                    {errors.consent}
                  </p>
                )}
              </div>
              {errors.form && (
                <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">
                  {errors.form} {errors.form === AUTH_MESSAGES["already-registered"] && <Link href="/signin" className="underline">Go to sign in</Link>}
                </p>
              )}
              <button type="submit" disabled={busy} className="group flex min-h-13 items-center justify-center gap-2 rounded-full bg-ember py-3.5 font-semibold text-void transition hover:bg-[#ff8a4a] active:scale-[0.99] disabled:opacity-60">
                {busy ? "Checking…" : "Continue to verification"}
                {!busy && <ArrowRight size={18} aria-hidden className="transition-transform group-hover:translate-x-1" />}
              </button>
              <p className="text-center text-sm text-fog">
                Already registered?{" "}
                <Link href="/signin" className="text-ember underline-offset-4 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}

          {stage === "code" && (
            <form onSubmit={submitCode} noValidate className="flex flex-col gap-5">
              <div>
                <h2 className="display text-2xl font-bold">Enter the code</h2>
                <p className="mt-1.5 text-sm text-fog">We sent a 6-digit code to the mobile number ending {normaliseMobile(f.mobile)?.slice(-4)}.</p>
              </div>
              <Field id="reg-code" label="One-time code" why="The code expires after a few minutes." error={errors.code}>
                <input id="reg-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" aria-invalid={!!errors.code} className={field + " tnum tracking-[0.4em]"} />
              </Field>
              <button type="submit" disabled={busy} className="min-h-13 rounded-full bg-ember py-3.5 font-semibold text-void transition hover:bg-[#ff8a4a] disabled:opacity-60">
                {busy ? "Verifying…" : "Verify and continue"}
              </button>
              <button type="button" onClick={() => setStage("details")} className="min-h-11 text-sm text-fog hover:text-bright">
                Change my details
              </button>
            </form>
          )}

          {stage === "blocked" && (
            <div className="flex flex-col gap-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ember-soft text-ember">
                <ShieldAlert size={24} aria-hidden />
              </span>
              <div>
                <h2 className="display text-2xl font-bold">Verification isn’t switched on yet</h2>
                <p className="mt-2 text-fog">{AUTH_MESSAGES["not-configured"]} Your details passed every check, and none of them left this browser.</p>
              </div>
              <p className="text-sm text-fog">You can carry on as a guest. Your state and city will be filled in for this visit so you don’t have to choose them again.</p>
              <button
                type="button"
                onClick={() => {
                  setGuest(true);
                  setStage("prefs");
                }}
                className="group flex min-h-13 items-center justify-center gap-2 rounded-full bg-ember py-3.5 font-semibold text-void transition hover:bg-[#ff8a4a]"
              >
                Continue as a guest
                <ArrowRight size={18} aria-hidden className="transition-transform group-hover:translate-x-1" />
              </button>
              <button type="button" onClick={() => setStage("details")} className="min-h-11 text-sm text-fog hover:text-bright">
                Back to my details
              </button>
            </div>
          )}

          {stage === "prefs" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="display text-2xl font-bold">Welcome, {f.name.trim().split(/\s+/)[0]}</h2>
                <p className="mt-1.5 text-sm text-fog">
                  {guest ? "You are browsing as a guest. These choices apply to this visit only and are not saved." : "Two optional choices to shape what you see first. You can change them any time."}
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pref-state" className="text-sm font-medium">
                    Preferred state
                  </label>
                  <select id="pref-state" value={f.state} onChange={(e) => set("state", e.target.value)} className={field}>
                    <option value="">No preference</option>
                    {SORTED.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pref-city" className="text-sm font-medium">
                    Preferred city
                  </label>
                  <select id="pref-city" value={f.city} onChange={(e) => set("city", e.target.value)} disabled={!region} className={field + " disabled:opacity-50"}>
                    <option value="">No preference</option>
                    {region?.cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <fieldset>
                <legend className="text-sm font-medium">Interested in (optional)</legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(
                    [
                      ["new", "New"],
                      ["used", "Used"],
                      ["", "Either"],
                    ] as const
                  ).map(([value, label]) => (
                    <label key={label} className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl text-sm font-medium ring-1 transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ember ${condition === value ? "bg-ember text-void ring-ember" : "bg-void text-fog ring-hairline-strong hover:text-bright"}`}>
                      <input type="radio" name="condition" value={value} checked={condition === value} onChange={() => setCondition(value)} className="sr-only" />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              {errors.form && (
                <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">
                  {errors.form}
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => finish(true)} disabled={busy} className="group flex min-h-13 flex-1 items-center justify-center gap-2 rounded-full bg-ember py-3.5 font-semibold text-void transition hover:bg-[#ff8a4a] disabled:opacity-60">
                  Start exploring
                  <ArrowRight size={18} aria-hidden className="transition-transform group-hover:translate-x-1" />
                </button>
                <button type="button" onClick={() => finish(false)} disabled={busy} className="min-h-13 rounded-full px-6 py-3.5 font-medium text-fog ring-1 ring-hairline-strong transition hover:bg-white/5 hover:text-bright">
                  Skip
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
