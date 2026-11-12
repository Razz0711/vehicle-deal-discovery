import type { Metadata } from "next";
import Link from "next/link";
import { StatusPage } from "@/components/account/StatusPage";
import { signOut } from "@/lib/auth-actions";
import { guard } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const { session } = await guard("account", "/account");
  const { state, phone, name } = session;
  const profile = state.configured ? state.profile : null;
  return (
    <StatusPage eyebrow="Account" title={name ? `Signed in as ${name.split(" ")[0]}` : "Signed in"}>
      {phone && <p>Mobile number ending {phone.slice(-4)}.</p>}
      {!profile?.onboarded && (
        <p>
          Your account is not finished yet.{" "}
          <Link href="/onboarding" className="text-ember underline underline-offset-4">
            Add your details
          </Link>{" "}
          to see actual offers.
        </p>
      )}
      {profile?.onboarded && profile.status !== "active" && <p role="alert">This account is not active. Contact support if you think this is a mistake.</p>}
      <form action={signOut}>
        <button type="submit" className="min-h-12 rounded-full px-6 font-medium text-bright ring-1 ring-hairline-strong transition hover:bg-white/5">
          Sign out
        </button>
      </form>
    </StatusPage>
  );
}
