import type { Metadata } from "next";
import Link from "next/link";
import { DraftNote, InfoPage, InfoSection } from "@/components/site/InfoPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="Privacy Policy" title="Your information, plainly" lead={`What ${SITE.name} does with personal information today, and what it will do once accounts are switched on.`}>
      <DraftNote>
        <strong>Pre-launch draft.</strong> This page describes the current preview accurately. The section on accounts is a statement of intent and has not yet been reviewed by a lawyer. It will be finalised before any personal information is collected.
      </DraftNote>
      <InfoSection title="Today: nothing is collected">
        <ul>
          <li>The site has no accounts, no database and no server that receives what you type.</li>
          <li>The sign-up, sign-in and enquiry forms check your entries inside your own browser. Nothing is sent or stored.</li>
          <li>Your search choices (vehicle type, state, city and so on) are kept in the page address so that refresh and the back button work. They are not linked to you.</li>
          <li>The site sets no advertising or tracking cookies.</li>
          <li>Vehicle photographs are loaded from Wikimedia&rsquo;s servers, which, like any web server, receive your IP address when your browser requests an image.</li>
        </ul>
      </InfoSection>
      <InfoSection title="When accounts are switched on">
        <p>We intend to ask for five things and nothing more:</p>
        <ul>
          <li><strong>Full name</strong>, so a seller you contact knows who is asking.</li>
          <li><strong>Mobile number</strong>, to verify it is you with a one-time code and to sign you in.</li>
          <li><strong>Email address</strong>, for records of enquiries you send and account recovery.</li>
          <li><strong>State and city</strong>, to show offers and taxes for where you will buy.</li>
        </ul>
        <p>One-time codes will be checked on the server and never stored in readable form. There are no passwords.</p>
      </InfoSection>
      <InfoSection title="Sharing">
        <p>Your details will be shared with a seller only when you send that seller an enquiry, and only the details needed to reply to it. We will not sell personal information.</p>
      </InfoSection>
      <InfoSection title="Your choices">
        <p>
          Once accounts exist you will be able to see, correct and delete your information and withdraw consent. How to do that, and who to contact with a complaint, will be set out here and on the <Link href="/contact">contact page</Link> before launch.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
