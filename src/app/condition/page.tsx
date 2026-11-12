import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { StepShell } from "@/components/StepShell";
import { getCategory } from "@/data/categories";
import { loadStep } from "@/lib/guard";
import { change, hrefFor, type RawParams } from "@/lib/selection";

export const metadata: Metadata = { title: "New or used" };

/**
 * Two text-led cards. There is deliberately no photograph here: a single
 * vehicle-type photo shown twice says nothing about new versus used.
 */
const OPTIONS = [
  {
    id: "new",
    title: "New",
    body: "Unregistered vehicles from authorised and multi-brand dealers.",
    compare: ["Ex-showroom price", "Registration and insurance", "Seller discounts", "On-road total"],
  },
  {
    id: "used",
    title: "Used",
    body: "Pre-owned vehicles from dealers, certified outlets and individual sellers.",
    compare: ["Asking price", "Year and kilometres", "Number of owners", "Seller type"],
  },
] as const;

export default async function Page({ searchParams }: { searchParams: Promise<RawParams> }) {
  const sel = await loadStep(3, searchParams);
  const noun = getCategory(sel.category!).singular;
  return (
    <StepShell index={3} sel={sel} title="New or used?" intro={`Tell us which kind of ${noun} you want. Different sellers offer each, and different details matter.`}>
      <ul className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map((o, i) => {
          const active = sel.condition === o.id;
          return (
            <li key={o.id} className="rise" style={{ animationDelay: 160 + i * 80 + "ms" }}>
              <Link
                href={hrefFor("/brand", change(sel, "condition", o.id))}
                aria-current={active ? "true" : undefined}
                className={`group surface flex h-full flex-col gap-6 rounded-[28px] p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 sm:p-7 ${active ? "is-selected" : ""}`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="display text-5xl font-extrabold">{o.title}</span>
                  <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-full transition-colors duration-300 ${active ? "bg-ember text-void" : "bg-white/[0.07] group-hover:bg-ember group-hover:text-void"}`}>
                    {active ? <Check size={18} strokeWidth={3} aria-label="Selected" /> : <ArrowRight size={18} aria-hidden />}
                  </span>
                </span>
                <span className="text-fog">{o.body}</span>
                <span className="mt-auto block border-t border-hairline pt-4">
                  <span className="eyebrow block text-ash">What you will compare</span>
                  <span className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm text-bright/90 min-[420px]:grid-cols-2">
                    {o.compare.map((c) => (
                      <span key={c} className="flex items-center gap-2">
                        <span aria-hidden className="h-1 w-1 flex-none rounded-full bg-ember" />
                        {c}
                      </span>
                    ))}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </StepShell>
  );
}
