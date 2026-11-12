import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, BadgeIndianRupee, ChevronDown, FileText, FlaskConical, Layers, MapPinned, ReceiptText, Scale, Store, Tags } from "lucide-react";
import { EdgeFloaters, HeroScene } from "@/components/landing/HeroScene";
import { JourneyPreview } from "@/components/landing/JourneyPreview";
import { Marquee } from "@/components/landing/Marquee";
import { PlatformShowcase } from "@/components/landing/PlatformShowcase";
import { Reveal } from "@/components/landing/Reveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { hrefFor, parseSelection, type RawParams } from "@/lib/selection";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} — ${SITE.tagline}` },
  description: SITE.description,
  openGraph: { title: `${SITE.name} — ${SITE.tagline}`, description: SITE.description, type: "website", siteName: SITE.name },
};

const FEATURES = [
  { Icon: MapPinned, title: "Compare Prices Across India", text: "Pick any state and city and see the offers for that place, so you can tell whether the price near you is a fair one." },
  { Icon: Tags, title: "Discover Dealer Offers", text: "Offers from different sellers for the same vehicle and variant, listed together instead of one enquiry at a time." },
  { Icon: ReceiptText, title: "Transparent Pricing", text: "Ex-showroom price, road tax and registration, insurance and other charges shown line by line, adding up to the on-road price." },
  { Icon: Layers, title: "New and Used Vehicles", text: "Cars, bikes, scooters, electric and commercial vehicles, new or used, through the same seven steps." },
  { Icon: Store, title: "Seller Information", text: "Each offer names the seller and the kind of seller, and says plainly whether its price has been verified." },
  { Icon: Scale, title: "Find Your Best Deal", text: "Put up to three offers side by side and see exactly where the rupees differ before you contact anyone." },
];

const HOW = [
  "Select your vehicle category.",
  "Choose your preferred state and city.",
  "Select new or used condition.",
  "Choose brand and model.",
  "Explore available deals.",
  "Compare prices, sellers and available offers.",
  "Contact the seller and proceed with your purchase.",
];

const LABELS = [
  { Icon: BadgeCheck, tone: "text-verify", name: "Verified price", text: "Backed by an invoice or booking record that has been checked." },
  { Icon: FileText, tone: "text-bright", name: "Seller-submitted", text: "Quoted by the seller and not yet checked by us." },
  { Icon: BadgeIndianRupee, tone: "text-fog", name: "Estimated", text: "Worked out from published prices and charges. A guide, not a quote." },
  { Icon: FlaskConical, tone: "text-ember", name: "Sample", text: "A made-up figure used to show the layout. Every offer on the site today carries this label." },
];

const FAQS = [
  { q: `What is ${SITE.name}?`, a: `A place to compare offers for the same vehicle from different sellers, in your city, priced the same way. You choose a vehicle type, state, city, new or used, brand, model and variant, then compare.` },
  { q: "Are the prices on the site real?", a: "Not yet. The site is a pre-launch preview. Sellers shown are fictional and prices are sample figures, each labelled “Sample price”. Real offers will replace them once sellers are connected, and each will say whether it is verified, seller-submitted or estimated." },
  { q: "Do I need an account?", a: "Not today. Account creation is built but mobile verification is not switched on yet, so you can explore as a guest. Nothing you type into the sign-up form is sent or stored." },
  { q: "Which vehicles and places are covered?", a: "Cars, bikes, scooters, electric vehicles and commercial vehicles, across all 28 states and 8 union territories. The city and model lists are a starter set and will grow." },
  { q: "Does it cost anything to use?", a: "Exploring and comparing is free for buyers." },
  { q: "Are the vehicle photographs the vehicles on offer?", a: "No. They are reference photographs by Wikimedia Commons contributors, credited on the photo credits page. A photograph is only shown beside a model when it depicts that model." },
];

function SectionHead({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="eyebrow text-ember">{eyebrow}</p>
      <h2 className="display mt-4 text-4xl font-extrabold sm:text-5xl">{title}</h2>
      {text && <p className="mt-4 text-lg text-fog">{text}</p>}
    </Reveal>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<RawParams> }) {
  // Step one used to live at "/". Old links that carry a selection still work.
  const sel = parseSelection(await searchParams);
  if (Object.keys(sel).length) redirect(hrefFor("/explore", sel));

  return (
    <>
      <SiteNav />
      <main>
        {/* B. Hero */}
        <section className="relative isolate flex min-h-[calc(100svh-var(--header-h))] flex-col overflow-hidden">
          <HeroScene />
          <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-start px-5 pb-[min(78vw,360px)] pt-12 sm:px-8 sm:pt-16 lg:justify-center lg:pb-24 lg:pt-10">
            <div className="max-w-xl">
              <p className="rise inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-fog ring-1 ring-hairline">
                <span className="h-1.5 w-1.5 rounded-full bg-ember" aria-hidden />
                Pre-launch preview · sample offers
              </p>
              <h1 className="display rise mt-6 text-[2.75rem] font-extrabold sm:text-6xl lg:text-7xl" style={{ animationDelay: "80ms" }}>
                Your Next Vehicle.
                <br />
                <span className="text-ember">Your Best Deal.</span>
              </h1>
              <p className="rise mt-6 max-w-lg text-lg text-fog sm:text-xl" style={{ animationDelay: "160ms" }}>
                Compare prices, explore offers across India, and find the perfect vehicle — all in one place.
              </p>
              <div className="rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
                <Link href="/register" className="group flex min-h-13 items-center gap-2 rounded-full bg-ember py-3.5 pl-7 pr-6 text-base font-semibold text-void shadow-[0_12px_40px_-12px_rgb(242_118_50/0.7)] transition hover:bg-[#ff8a4a] active:scale-[0.98]">
                  Explore Better Deals
                  <ArrowRight size={18} aria-hidden className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="#how" className="flex items-center rounded-full bg-void/40 px-6 py-3.5 font-medium text-bright ring-1 ring-hairline-strong backdrop-blur transition hover:bg-white/10">
                  How It Works
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Continuous showcase */}
        <section aria-label="Vehicle showcase" className="border-y border-hairline bg-void/60 py-10">
          <Marquee />
          <p className="mx-auto mt-5 max-w-7xl px-5 text-center text-xs text-ash sm:px-8">
            Reference photographs of vehicle types, by Wikimedia Commons contributors. They are not listings.{" "}
            <Link href="/credits" className="underline underline-offset-4 hover:text-bright">
              Photo credits
            </Link>
          </p>
        </section>

        {/* C. Discovery preview */}
        <section id="journey" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <SectionHead eyebrow="Seven steps" title="From “what should I buy” to a clear comparison" text="Each step narrows the search, so the offers you see at the end are for exactly the vehicle you want, where you want it." />
          <Reveal className="mt-12" delay={0.1}>
            <JourneyPreview />
          </Reveal>
          <Reveal className="mt-8 flex justify-center">
            <Link href="/register" className="group flex min-h-12 items-center gap-2 rounded-full bg-ember pl-6 pr-5 font-semibold text-void transition hover:bg-[#ff8a4a] active:scale-[0.98]">
              Explore Better Deals
              <ArrowRight size={18} aria-hidden className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </section>

        {/* D. Why */}
        <section id="why" className="relative border-t border-hairline">
          <EdgeFloaters left="sports" right="suv" />
          <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
            <SectionHead eyebrow={`Why ${SITE.name}?`} title="Built for the buyer's side of the table" text="What the platform is designed to do. See “Trust and transparency” below for what is live today." />
            <ul className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => (
                <li key={f.title}>
                  <Reveal delay={(i % 3) * 0.08} className="h-full">
                    <article className="surface group h-full rounded-3xl p-6 transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] hover:-translate-y-1.5">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ember-soft text-ember transition-transform duration-500 group-hover:scale-110">
                        <f.Icon size={22} aria-hidden />
                      </span>
                      <h3 className="display mt-5 text-xl font-bold">{f.title}</h3>
                      <p className="mt-2 text-fog">{f.text}</p>
                    </article>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* E. How it works */}
        <section id="how" className="border-t border-hairline">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
            <SectionHead eyebrow="How It Works" title="Seven steps, one clear answer" />
            <ol className="mx-auto mt-12 max-w-3xl">
              {HOW.map((text, i) => (
                <li key={text}>
                  <Reveal delay={0.04 * i} className="grid grid-cols-[auto_1fr] gap-5">
                    <div className="flex flex-col items-center">
                      <span className="display tnum flex h-11 w-11 flex-none items-center justify-center rounded-full bg-ember-soft text-lg font-bold text-ember ring-1 ring-ember/40">{i + 1}</span>
                      {i < HOW.length - 1 && <span aria-hidden className="w-px flex-1 bg-gradient-to-b from-ember/40 to-hairline" />}
                    </div>
                    <p className="pb-8 pt-2 text-lg">
                      <span className="eyebrow mr-2 text-ash">Step {i + 1}</span>
                      <span className="block text-xl font-medium sm:inline">{text}</span>
                    </p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* F. Explore the platform */}
        <section id="explore" className="border-t border-hairline">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
            <SectionHead eyebrow="Explore Our Platform" title="Start with the kind of vehicle you want" text="This is the real first step of the application. Choose a category and you are inside it." />
            <Reveal className="mt-12" delay={0.1}>
              <PlatformShowcase />
            </Reveal>
          </div>
        </section>

        {/* G. Trust */}
        <section id="trust" className="relative border-t border-hairline">
          <EdgeFloaters left="superbike" right="ev" />
          <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
            <SectionHead eyebrow="Trust and transparency" title="Every price says where it came from" text="A comparison is only useful if you know how far to trust each number. So each offer carries one of four labels, and they are never mixed up." />
            <ul className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {LABELS.map((l, i) => (
                <li key={l.name}>
                  <Reveal delay={i * 0.07} className="h-full">
                    <div className="surface h-full rounded-3xl p-6">
                      <l.Icon size={26} aria-hidden className={l.tone} />
                      <h3 className="display mt-4 text-lg font-bold">{l.name}</h3>
                      <p className="mt-2 text-sm text-fog">{l.text}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
            <Reveal className="mx-auto mt-6 max-w-5xl">
              <div className="rounded-3xl bg-ember-soft p-6 ring-1 ring-ember/30 sm:p-8">
                <h3 className="display text-xl font-bold">Where things stand today</h3>
                <ul className="mt-4 grid gap-x-10 gap-y-3 text-bright/90 sm:grid-cols-2">
                  <li>No real sellers are connected yet. Sellers shown are fictional.</li>
                  <li>No price on the site is verified or seller-submitted. All are samples.</li>
                  <li>We will not call a seller or a listing verified unless it has been checked.</li>
                  <li>Paid placement will never change the order of price comparisons.</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FAQs */}
        <section id="faqs" className="border-t border-hairline">
          <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
            <SectionHead eyebrow="FAQs" title="Questions, answered plainly" />
            <div className="mt-10 flex flex-col gap-3">
              {FAQS.map((f) => (
                <details key={f.q} className="surface group rounded-2xl">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-lg font-medium [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronDown size={20} aria-hidden className="flex-none text-ash transition-transform duration-300 group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-fog">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* H. Final CTA */}
        <section className="relative isolate overflow-hidden border-t border-hairline">
          <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_120%_at_50%_100%,rgb(242_118_50/0.22),transparent_70%)]" />
          <Reveal className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8 sm:py-32">
            <h2 className="display text-4xl font-extrabold sm:text-6xl">Ready to Find Your Perfect Deal?</h2>
            <p className="mt-5 text-lg text-fog sm:text-xl">Start exploring smarter vehicle deals with {SITE.name}.</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/register" className="group flex min-h-14 items-center gap-2 rounded-full bg-ember pl-8 pr-7 text-lg font-semibold text-void shadow-[0_16px_50px_-14px_rgb(242_118_50/0.8)] transition hover:bg-[#ff8a4a] active:scale-[0.98]">
                Get Started
                <ArrowRight size={20} aria-hidden className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/explore" className="flex min-h-14 items-center rounded-full px-7 text-lg font-medium text-bright ring-1 ring-hairline-strong transition hover:bg-white/5">
                Explore as a guest
              </Link>
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
