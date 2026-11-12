import Link from "next/link";
import { Info } from "lucide-react";
import { AUTH } from "@/lib/auth";
import { signInWithGoogle } from "@/lib/auth-actions";

const ERRORS: Record<string, string> = {
  oauth: "Google sign-in did not complete. Please try again.",
  cancelled: "Google sign-in was cancelled.",
  "not-configured": "Sign-in is not connected on this site yet, so no account was created.",
};

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

/** The one sign-in control for buyers, sellers and staff (D3-13). Works without JavaScript. */
export function GoogleSignIn({ next, error, intent }: { next?: string; error?: string; intent: "signin" | "register" }) {
  const message = error ? (ERRORS[error] ?? ERRORS.oauth) : null;
  if (!AUTH.configured) {
    return (
      <div className="surface flex flex-col gap-4 rounded-3xl p-6 sm:p-8">
        <p role="note" className="flex gap-3 rounded-xl bg-ember-soft p-3.5 text-sm ring-1 ring-ember/30">
          <Info size={18} aria-hidden className="mt-0.5 flex-none text-ember" />
          <span>{ERRORS["not-configured"]}</span>
        </p>
        <Link href="/explore" className="text-center font-medium text-ember underline underline-offset-4">
          Explore as a guest
        </Link>
      </div>
    );
  }
  return (
    <form action={signInWithGoogle} className="surface flex flex-col gap-5 rounded-3xl p-6 sm:p-8">
      {next && <input type="hidden" name="next" value={next} />}
      {message && (
        <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">
          {message}
        </p>
      )}
      <button type="submit" className="flex min-h-13 items-center justify-center gap-3 rounded-full bg-white py-3.5 font-semibold text-[#1f1f1f] transition hover:bg-white/90 active:scale-[0.99]">
        <GoogleMark />
        Continue with Google
      </button>
      <p className="text-center text-xs text-ash">
        {intent === "register" ? "New here? Google confirms your email, then you add your state and city once." : "Returning or new, the same button works."} We never see your Google password.
      </p>
      <p className="text-center text-sm text-fog">
        {intent === "register" ? "Already registered? " : "New here? "}
        <Link href={(intent === "register" ? "/signin" : "/register") + (next ? `?next=${encodeURIComponent(next)}` : "")} className="text-ember underline-offset-4 hover:underline">
          {intent === "register" ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
