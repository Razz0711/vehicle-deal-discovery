import Link from "next/link";
import { SITE } from "@/lib/site";
import { Logo } from "../chrome/TopBar";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { href: "/explore", label: "Explore vehicles" },
      { href: "/#how", label: "How it works" },
      { href: "/#why", label: "Why " + SITE.name + "?" },
      { href: "/#faqs", label: "FAQs" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms and Conditions" },
      { href: "/credits", label: "Photo credits" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-void">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link href="/" className="display flex items-center gap-2.5 text-[17px] font-bold tracking-tight">
            <Logo />
            {SITE.name}
          </Link>
          <p className="mt-4 max-w-xs text-sm text-fog">{SITE.tagline}</p>
          {SITE.social.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-4 text-sm">
              {SITE.social.map((s) => (
                <li key={s.href}>
                  <a href={s.href} className="text-fog hover:text-bright">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="eyebrow text-ash">{col.title}</p>
            <ul className="mt-4 flex flex-col">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="flex min-h-10 items-center text-sm text-fog transition-colors hover:text-bright">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-hairline">
        <p className="mx-auto max-w-7xl px-5 py-5 text-xs text-ash sm:px-8">
          Pre-launch preview. Offers shown on this site are samples, not real prices. Vehicle photographs are by Wikimedia Commons contributors and are not listings.
        </p>
      </div>
    </footer>
  );
}
