import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { StepShell } from "@/components/StepShell";
import { VehiclePhoto } from "@/components/vehicles/VehiclePhoto";
import { getCategory } from "@/data/categories";
import { loadStep } from "@/lib/guard";
import { change, hrefFor, vehicleKind, type RawParams } from "@/lib/selection";

export const metadata: Metadata = { title: "New or used" };

const OPTIONS = [
  { id: "new", title: "New vehicle", body: "From authorised and multi-brand dealers, with itemised on-road pricing." },
  { id: "used", title: "Used vehicle", body: "From used-vehicle dealers, certified pre-owned outlets and individual sellers." },
] as const;

export default async function Page({ searchParams }: { searchParams: Promise<RawParams> }) {
  const sel = await loadStep(3, searchParams);
  const noun = getCategory(sel.category!).singular;
  return (
    <StepShell index={3} sel={sel} title="New or used?" intro={`Tell us which kind of ${noun} you want. The sellers and the price details differ for each.`}>
      <ul className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map((o) => {
          const active = sel.condition === o.id;
          return (
            <li key={o.id}>
              <Link
                href={hrefFor("/brand", change(sel, "condition", o.id))}
                aria-current={active ? "true" : undefined}
                className={`group flex h-full flex-col overflow-hidden rounded-md border transition-colors ${active ? "border-paper" : "border-line hover:border-sky"}`}
              >
                <span className="relative block h-40 overflow-hidden bg-ink-2">
                  <span className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
                    <VehiclePhoto kind={vehicleKind(sel)} sizes="(min-width: 640px) 380px, 100vw" />
                  </span>
                </span>
                <span className={`flex flex-1 flex-col gap-1 p-5 ${active ? "bg-paper text-ink" : "bg-ink-2"}`}>
                  <span className="flex items-center justify-between gap-3">
                    <span className="display text-2xl font-bold" style={{ fontStretch: "112%" }}>{o.title}</span>
                    {active && <Check size={20} aria-label="Selected" className="text-blue-deep" />}
                  </span>
                  <span className={active ? "text-slate" : "text-soft"}>{o.body}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </StepShell>
  );
}
