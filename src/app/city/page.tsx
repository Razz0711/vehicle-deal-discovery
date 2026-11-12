import type { Metadata } from "next";
import { SearchPicker } from "@/components/SearchPicker";
import { StepShell } from "@/components/StepShell";
import { getRegion } from "@/data/locations";
import { loadStep } from "@/lib/guard";
import { change, hrefFor, type RawParams } from "@/lib/selection";
import { slug } from "@/lib/slug";

export const metadata: Metadata = { title: "Choose your city" };

export default async function Page({ searchParams }: { searchParams: Promise<RawParams> }) {
  const sel = await loadStep(2, searchParams);
  const region = getRegion(sel.state!)!;
  const items = region.cities.map((city) => ({
    id: slug(city),
    label: city,
    href: hrefFor("/condition", change(sel, "city", slug(city))),
    selected: sel.city === slug(city),
  }));
  return (
    <StepShell index={2} sel={sel} title={`Which city in ${region.name}?`} intro="We list major cities for now. More towns will be added as coverage grows.">
      <SearchPicker items={items} searchLabel={`Search cities in ${region.name}`} placeholder="Search cities" noun="cities" />
    </StepShell>
  );
}
