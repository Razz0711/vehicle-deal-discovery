import type { Metadata } from "next";
import { ModelPicker } from "@/components/steps/ModelPicker";
import { StepShell } from "@/components/StepShell";
import { getBrand } from "@/data/catalog";
import { loadStep } from "@/lib/guard";
import type { RawParams } from "@/lib/selection";

export const metadata: Metadata = { title: "Choose model and variant" };

export default async function Page({ searchParams }: { searchParams: Promise<RawParams> }) {
  const sel = await loadStep(5, searchParams);
  const brand = getBrand(sel.category!, sel.brand!)!;
  return (
    <StepShell index={5} sel={sel} title="Which model and variant?" intro="Prices differ a lot between variants, so offers are only compared for the exact one you pick.">
      <ModelPicker sel={sel} models={brand.models} brandName={brand.name} />
    </StepShell>
  );
}
