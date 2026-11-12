import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/site/InfoPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <InfoPage eyebrow="Contact" title="Get in touch">
      <InfoSection title="Email">
        {SITE.contactEmail ? (
          <p>
            Write to <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
          </p>
        ) : (
          <p>
            {SITE.name} is in pre-launch and has not published a contact address yet. One will appear on this page before real offers go live.
          </p>
        )}
      </InfoSection>
      <InfoSection title="In the meantime">
        <p>
          Most questions about how the site works, what is real and what is a sample are answered in the <Link href="/#faqs">FAQs</Link>. Photograph attribution is on the <Link href="/credits">photo credits</Link> page.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
