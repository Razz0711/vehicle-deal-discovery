"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Menu, X } from "lucide-react";
import { SITE } from "@/lib/site";
import { Logo, usePublishedHeight } from "../chrome/TopBar";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/#explore", label: "Explore" },
  { href: "/#why", label: "Why " + SITE.name + "?" },
  { href: "/#how", label: "How It Works" },
  { href: "/#faqs", label: "FAQs" },
];

/** Navigation for the landing, account and information pages. */
/** Display only: an auth cookie is present. Access is always decided on the server. */
const noSubscribe = () => () => {};
function useHasSessionCookie() {
  return useSyncExternalStore(
    noSubscribe,
    () => /(?:^|;\s*)sb-[^=]+-auth-token(?:\.0)?=/.test(document.cookie),
    () => false,
  );
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const signedIn = useHasSessionCookie();
  const ref = usePublishedHeight();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header ref={ref} className="sticky top-0 z-40 border-b border-hairline bg-void/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link href="/" className="display flex min-h-11 items-center gap-2.5 text-[17px] font-bold tracking-tight">
          <Logo />
          {SITE.name}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-3.5 py-2 text-sm text-fog transition-colors hover:bg-white/5 hover:text-bright">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link href="/account" className="flex min-h-11 items-center rounded-full px-5 text-sm font-semibold text-bright ring-1 ring-hairline-strong transition hover:bg-white/5">
              Account
            </Link>
          ) : (
            <>
              <Link href="/signin" className="hidden min-h-11 items-center rounded-full px-4 text-sm font-medium text-fog transition-colors hover:text-bright sm:flex">
                Sign In
              </Link>
              <Link href="/register" className="flex min-h-11 items-center rounded-full bg-ember px-5 text-sm font-semibold text-void transition hover:bg-[#ff8a4a] active:scale-[0.98]">
                Get Started
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-11 w-11 items-center justify-center rounded-full text-bright ring-1 ring-hairline-strong lg:hidden"
          >
            {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Main" className="border-t border-hairline bg-void lg:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col px-5 py-3 sm:px-8">
            {[...LINKS, { href: "/signin", label: "Sign In" }].map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center border-b border-hairline text-lg text-bright last:border-0">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
