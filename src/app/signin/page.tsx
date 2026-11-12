import type { Metadata } from "next";
import { SignInForm } from "@/components/account/SignInForm";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-md px-5 pb-24 pt-12 sm:px-8 sm:pt-20">
        <p className="eyebrow text-ember">Sign in</p>
        <h1 className="display mt-4 text-4xl font-extrabold">Welcome back</h1>
        <p className="mb-8 mt-4 text-fog">Enter your mobile number and we will send a one-time code. There are no passwords.</p>
        <SignInForm />
      </main>
      <SiteFooter />
    </>
  );
}
