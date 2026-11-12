import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Lock, MapPin, UserCheck } from "lucide-react";
import { GoogleSignIn } from "@/components/account/GoogleSignIn";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { safeNext } from "@/lib/auth/redirect";
import { readSession } from "@/lib/auth/session";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Get started", description: `Create a ${SITE.name} account to keep your location and preferences across visits.` };

const POINTS = [
  { Icon: UserCheck, title: "A few details, once", text: "Google confirms your email. You add your name, state and city; a mobile number is optional. No address, no documents, no date of birth." },
  { Icon: MapPin, title: "Your location does real work", text: "It decides which offers and which taxes apply, so you see prices for where you will buy." },
  { Icon: Lock, title: "Shared only when you ask", text: "A seller sees your details only if you send that seller an enquiry." },
];

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string | string[]; error?: string | string[] }> }) {
  const sp = await searchParams;
  const raw = sp.next;
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const next = safeNext(Array.isArray(raw) ? raw[0] : raw, "") || undefined;
  const { state } = await readSession();
  if (state.configured && state.user && !state.user.anonymous) redirect(state.profile?.onboarded ? safeNext(next) : next ? `/onboarding?next=${encodeURIComponent(next)}` : "/onboarding");

  return (
    <>
      <SiteNav />
      <main className="mx-auto grid max-w-6xl gap-10 px-5 pb-24 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1fr_minmax(0,520px)] lg:gap-16">
        <div className="lg:pt-6">
          <p className="eyebrow text-ember">Get started</p>
          <h1 className="display mt-4 text-4xl font-extrabold sm:text-5xl">One account, every comparison</h1>
          <p className="mt-5 max-w-md text-lg text-fog">Sign up once and {SITE.name} remembers where you are buying and what you are looking for.</p>
          <ul className="mt-10 hidden flex-col gap-6 lg:flex">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-ember-soft text-ember">
                  <p.Icon size={20} aria-hidden />
                </span>
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="mt-1 text-sm text-fog">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:pt-6"><GoogleSignIn next={next} error={error} intent="register" /></div>
      </main>
      <SiteFooter />
    </>
  );
}
