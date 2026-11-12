import type { Metadata } from "next";
import { StatusPage } from "@/components/account/StatusPage";
import { guard } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Seller portal" };

export default async function PartnerPage() {
  const { decision } = await guard("partner", "/partner");
  if (decision.action === "deny") {
    return (
      <StatusPage eyebrow="Seller portal" title="Access unavailable">
        <p>This account is not active.</p>
      </StatusPage>
    );
  }
  // Organisation membership arrives with seller onboarding (Phase 6). No seller data exists yet.
  return (
    <StatusPage eyebrow="Seller portal" title="Not open yet">
      <p>The seller portal for dealers and agencies is being built. Sellers will be verified before any listing is shown to buyers.</p>
    </StatusPage>
  );
}
