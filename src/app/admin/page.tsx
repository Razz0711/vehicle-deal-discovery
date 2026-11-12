import type { Metadata } from "next";
import { StatusPage } from "@/components/account/StatusPage";
import { guard } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Staff", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const { decision } = await guard("admin", "/admin");
  // Staff access needs two-step sign-in (aal2) and a staff grant. Grants arrive in Phase 6, so
  // decideAccess() refuses everyone today (fail closed).
  const reason = decision.action === "deny" ? decision.reason : "no-staff-access";
  return (
    <StatusPage eyebrow="Staff" title="No access">
      <p>{reason === "mfa-required" ? "Staff areas require two-step sign-in with an authenticator app." : "This account does not have staff access."}</p>
    </StatusPage>
  );
}
