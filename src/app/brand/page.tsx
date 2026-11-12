import type { Metadata } from "next";
import { SearchPicker } from "@/components/SearchPicker";
import { StepShell } from "@/components/StepShell";
import { CATALOG } from "@/data/catalog";
import { getCategory } from "@/data/categories";
import { loadStep } from "@/lib/guard";
import { change, hrefFor, type RawParams } from "@/lib/selection";

export const metadata: Metadata = { title: "Choose a brand" };

/** Initials for a brand tile. No brand logos are used. */
function monogram(name: string): string {
  const words = name.split(/[\s-]+/).filter(Boolean);
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  return name.length <= 3 ? name.toUpperCase() : name.slice(0, 2);
}

export default async function Page({ searchParams }: { searchParams: Promise<RawParams> }) {
  const sel = await loadStep(4, searchParams);
  const category = getCategory(sel.category!);
  const items = CATALOG[category.id].map((brand) => ({
    id: brand.id,
    mark: monogram(brand.name),
    label: brand.name,
    sub: brand.models.length + (brand.models.length === 1 ? " model" : " models"),
    href: hrefFor("/model", change(sel, "brand", brand.id)),
    selected: sel.brand === brand.id,
  }));
  return (
    <StepShell index={4} sel={sel} title="Which brand?" intro={`Brands that make ${category.label.toLowerCase()}. This is a starter list and will grow.`}>
      <SearchPicker items={items} searchLabel="Search brands" placeholder="Search brands" noun="brands" />
    </StepShell>
  );
}
