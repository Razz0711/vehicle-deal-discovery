import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/site/InfoPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "About us" };

export default function AboutPage() {
  return (
    <InfoPage eyebrow="About us" title={`What ${SITE.name} is for`} lead="Two sellers in the same city can quote different prices for the same vehicle, and a buyer usually finds out only by visiting both.">
      <InfoSection title="The idea">
        <p>{SITE.name} puts offers for the same vehicle and variant, in the same city, next to each other, priced the same way. The buyer sees the spread before contacting anyone.</p>
        <p>It covers cars, bikes, scooters, electric vehicles and commercial vehicles, new and used, across India.</p>
      </InfoSection>
      <InfoSection title="How we intend to run it">
        <ul>
          <li>The buyer comes first. Sellers are welcome as partners, but paid placement never changes the order of a price comparison.</li>
          <li>Every price carries a label saying whether it is verified, seller-submitted, estimated or a sample.</li>
          <li>A buyer&rsquo;s details go to a seller only when the buyer sends that seller an enquiry.</li>
        </ul>
      </InfoSection>
      <InfoSection title="Where we are">
        <p>
          This is a pre-launch preview. The seven-step search works; the offers at the end of it are samples with fictional sellers. Accounts and real seller offers are not connected yet. The name {SITE.name} is a working title.
        </p>
        <p>
          <Link href="/explore">Try the search</Link> or read the <Link href="/#faqs">FAQs</Link>.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
