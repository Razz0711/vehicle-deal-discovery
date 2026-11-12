import type { Metadata } from "next";
import Link from "next/link";
import { DraftNote, InfoPage, InfoSection } from "@/components/site/InfoPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms and Conditions" };

export default function TermsPage() {
  return (
    <InfoPage eyebrow="Terms and Conditions" title="Terms of use" lead="The terms for using this pre-launch preview.">
      <DraftNote>
        <strong>Pre-launch draft.</strong> These terms cover the preview only and have not yet been reviewed by a lawyer. Full terms will replace them before real offers or accounts go live.
      </DraftNote>
      <InfoSection title="What this site is">
        <p>{SITE.name} is a preview of a vehicle offer comparison service. It is provided so the idea and the experience can be tried.</p>
      </InfoSection>
      <InfoSection title="Sample offers">
        <ul>
          <li>Every offer shown is a sample. Sellers are fictional and prices are made-up figures, not the price of any vehicle anywhere.</li>
          <li>Nothing on the site is an offer to sell, a quotation or financial advice. Do not rely on any figure here when buying a vehicle.</li>
          <li>The lists of brands, models, variants and cities are a starter set and may be incomplete or out of date.</li>
        </ul>
      </InfoSection>
      <InfoSection title="Enquiries and accounts">
        <p>The enquiry and sign-up forms are demonstrations. They do not contact a seller or create an account.</p>
      </InfoSection>
      <InfoSection title="Names, marks and photographs">
        <p>
          Vehicle and manufacturer names belong to their owners and are used only to identify vehicles. {SITE.name} is not affiliated with or endorsed by any manufacturer. Photographs are used under Creative Commons licences and credited on the <Link href="/credits">photo credits</Link> page.
        </p>
      </InfoSection>
      <InfoSection title="Privacy">
        <p>
          See the <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
