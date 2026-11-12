import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/account/SignInForm";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { safeNext } from "@/lib/auth/redirect";
import { readSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const raw = (await searchParams).next;
  const next = safeNext(Array.isArray(raw) ? raw[0] : raw, "") || undefined;
  const { state } = await readSession();
  if (state.configured && state.user && !state.user.anonymous) redirect(state.profile?.onboarded ? safeNext(next) : next ? `/onboarding?next=${encodeURIComponent(next)}` : "/onboarding");

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-md px-5 pb-24 pt-12 sm:px-8 sm:pt-20">
        <p className="eyebrow text-ember">Sign in</p>
        <h1 className="display mt-4 text-4xl font-extrabold">Welcome back</h1>
        <p className="mb-8 mt-4 text-fog">{next ? "Sign in to see actual offers. " : ""}Enter your mobile number and we will send a one-time code. There are no passwords.</p>
        <SignInForm next={next} />
      </main>
      <SiteFooter />
    </>
  );
}
