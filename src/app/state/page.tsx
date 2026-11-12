import type { Metadata } from "next";
import { SearchPicker } from "@/components/SearchPicker";
import { StepShell } from "@/components/StepShell";
import { REGIONS } from "@/data/locations";
import { loadStep } from "@/lib/guard";
import { change, hrefFor, type RawParams } from "@/lib/selection";

export const metadata: Metadata = { title: "Choose your state" };

export default async function Page({ searchParams }: { searchParams: Promise<RawParams> }) {
  const sel = await loadStep(1, searchParams);
  const items = REGIONS.map((r) => ({
    id: r.code,
    label: r.name,
    sub: r.cities.length + (r.cities.length === 1 ? " city" : " cities"),
    group: r.type === "state" ? "States" : "Union territories",
    href: hrefFor("/city", change(sel, "state", r.code)),
    selected: sel.state === r.code,
  }));
  return (
    <StepShell index={1} sel={sel} title="Which state are you buying in?" intro="Registration charges and road tax depend on the state, so prices are compared within it.">
      <SearchPicker items={items} searchLabel="Search states and union territories" placeholder="Search states and union territories" noun="states and union territories" />
    </StepShell>
  );
}
