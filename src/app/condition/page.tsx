import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { StepShell } from "@/components/StepShell";
import { VehiclePhoto } from "@/components/vehicles/VehiclePhoto";
import { getCategory } from "@/data/categories";
import { loadStep } from "@/lib/guard";
import { change, hrefFor, vehicleKind, type RawParams } from "@/lib/selection";

export const metadata: Metadata = { title: "New or used" };

const OPTIONS = [
  { id: "new", title: "New", body: "From authorised and multi-brand dealers, with itemised on-road pricing.", points: ["Full price breakdown", "Stock and delivery status"] },
  { id: "used", title: "Used", body: "From used-vehicle dealers, certified pre-owned outlets and individual sellers.", points: ["Year, kilometres and owners", "Asking prices side by side"] },
] as const;

export default async function Page({ searchParams }: { searchParams: Promise<RawParams> }) {
  const sel = await loadStep(3, searchParams);
  const noun = getCategory(sel.category!).singular;
  return (
    <StepShell index={3} sel={sel} title="New or used?" intro={`Tell us which kind of ${noun} you want. The sellers and the price details differ for each.`}>
      <ul className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map((o, i) => {
          const active = sel.condition === o.id;
          return (
            <li key={o.id} className="rise" style={{ animationDelay: 180 + i * 90 + "ms" }}>
              <Link
                href={hrefFor("/brand", change(sel, "condition", o.id))}
                aria-current={active ? "true" : undefined}
                className={`group relative flex min-h-[300px] flex-col [@media(min-height:900px)]:min-h-[380px] overflow-hidden rounded-[28px] transition-shadow duration-500 ${
                  active ? "is-selected" : "surface hover:shadow-[0_0_0_1px_rgb(242_118_50/0.5),0_30px_60px_-30px_rgb(242_118_50/0.45)]"
                }`}
              >
                <span className="absolute inset-0">
                  <VehiclePhoto
                    kind={vehicleKind(sel)}
                    sizes="(min-width: 640px) 420px, 100vw"
                    showNote={i === 0}
                    decorative
                    className={`transition-transform duration-[1200ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.06] ${o.id === "used" ? "saturate-[0.65]" : ""}`}
                  />
                </span>
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-void via-void/55 to-transparent" />
                <span className="relative mt-auto flex flex-col gap-3 p-6">
                  <span className="flex items-end justify-between gap-3">
                    <span className="display text-5xl font-extrabold">{o.title}</span>
                    <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-full transition-colors duration-300 ${active ? "bg-ember text-void" : "bg-white/10 group-hover:bg-ember group-hover:text-void"}`}>
                      {active ? <Check size={18} strokeWidth={3} aria-label="Selected" /> : <ArrowRight size={18} aria-hidden />}
                    </span>
                  </span>
                  <span className="text-fog">{o.body}</span>
                  <span className="flex flex-wrap gap-2 pt-1">
                    {o.points.map((p) => (
                      <span key={p} className="rounded-full bg-white/[0.07] px-3 py-1 text-xs text-fog">
                        {p}
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
