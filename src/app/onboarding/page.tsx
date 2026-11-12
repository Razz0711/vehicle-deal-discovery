import type { Metadata } from "next";
import { OnboardingForm } from "@/components/account/OnboardingForm";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { safeNext } from "@/lib/auth/redirect";
import { guard } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Finish your account" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const raw = (await searchParams).next;
  const next = safeNext(Array.isArray(raw) ? raw[0] : raw, "") || undefined;
  await guard("onboarding", next ?? "/explore");
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-lg px-5 pb-24 pt-12 sm:px-8 sm:pt-20">
        <p className="eyebrow text-ember">Almost done</p>
        <h1 className="display mt-4 text-4xl font-extrabold">Finish your account</h1>
        <p className="mb-8 mt-4 text-fog">Your mobile number is verified. These details are needed once, before you can see actual offers.</p>
        <OnboardingForm next={next} />
      </main>
      <SiteFooter />
    </>
  );
}
