"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Check, RotateCcw } from "lucide-react";
import { STEPS, hrefFor, parseSelection } from "@/lib/selection";
import { SITE } from "@/lib/site";

export function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
      <rect x="1" y="1" width="26" height="26" rx="8" fill="#F27632" />
      <path d="M8 18.5l4-9 3 5.5 2-3 3 6.5" fill="none" stroke="#0A0A0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Header and progress, mounted once in the root layout so the progress bar
 * animates smoothly from one step to the next instead of re-mounting.
 */
export function TopBar() {
  const path = usePathname();
  const params = useSearchParams();
  const sel = parseSelection(Object.fromEntries(params.entries()));
  const index = Math.max(0, STEPS.findIndex((s) => s.path === path));
  const known = STEPS.some((s) => s.path === path);
  const fill = index / (STEPS.length - 1);

  // Publish the bar's real height so sticky panels and scroll targets
  // elsewhere sit exactly below it, whatever the screen size.
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty("--header-h", el.offsetHeight + "px");
    set();
    const observer = new ResizeObserver(set);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header ref={ref} className="bar sticky top-0 z-30 border-b border-hairline">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link href="/" className="display flex items-center gap-2.5 text-[17px] font-bold tracking-tight">
          <Logo />
          {SITE.name}
        </Link>
        <Link href="/" className="flex min-h-11 items-center gap-2 rounded-full px-3 text-sm text-fog transition-colors hover:bg-white/5 hover:text-bright">
          <RotateCcw size={15} aria-hidden />
          Start over
        </Link>
      </div>

      {known && (
        <nav aria-label="Progress" className="mx-auto max-w-7xl px-5 pb-3 sm:px-8">
          <div className="relative h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-ember-deep to-ember shadow-[0_0_12px_rgb(242_118_50/0.7)]"
              initial={false}
              animate={{ width: `${Math.max(fill, 0.04) * 100}%` }}
              transition={{ type: "spring", stiffness: 70, damping: 18 }}
            />
          </div>
          <ol className="no-scrollbar mt-2.5 flex gap-1 overflow-x-auto sm:justify-between">
            {STEPS.map((step, i) => {
              const reachable = STEPS.slice(0, i).every((s) => s.done(sel));
              const done = i < index;
              const current = i === index;
              const content = (
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <span
                    className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                      current ? "bg-ember text-void" : done ? "bg-white/12 text-bright" : "bg-white/[0.04] text-ash"
                    }`}
                  >
                    {done ? <Check size={12} strokeWidth={3} aria-hidden /> : i + 1}
                  </span>
                  <span className={`text-[13px] ${current ? "font-semibold text-bright" : done ? "text-fog" : "text-ash"}`}>{step.label}</span>
                </span>
              );
              return (
                <li key={step.path} aria-current={current ? "step" : undefined} className={current ? "" : "hidden sm:block"}>
                  {reachable && !current ? (
                    <Link href={hrefFor(step.path, sel)} className="flex items-center rounded-full px-2 py-1.5 transition-colors hover:bg-white/5 [@media(pointer:coarse)]:min-h-11">
                      {content}
                    </Link>
                  ) : (
                    <span className="block px-2 py-1.5">{content}</span>
                  )}
                </li>
              );
            })}
            <li className="ml-auto text-[13px] text-ash sm:hidden" aria-hidden>
              {index + 1} / {STEPS.length}
            </li>
          </ol>
        </nav>
      )}
    </header>
  );
}
