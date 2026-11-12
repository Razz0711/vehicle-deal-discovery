import type { Metadata } from "next";
import { DealsView } from "@/components/steps/DealsView";
import { StepShell } from "@/components/StepShell";
import { getModel } from "@/data/catalog";
import { sampleDeals } from "@/data/sampleDeals";
import { loadStep } from "@/lib/guard";
import { guard } from "@/lib/auth/session";
import { describe, hrefFor, modelKey, vehicleForm, type RawParams } from "@/lib/selection";
import { slug } from "@/lib/slug";

export const metadata: Metadata = { title: "Vehicle deals" };

export default async function Page({ searchParams }: { searchParams: Promise<RawParams> }) {
  const sel = await loadStep(6, searchParams);
  // Decision D14: actual offers only for registered buyers. Steps 1 to 6 stay public.
  await guard("buyer", hrefFor("/deals", sel));
  const d = describe(sel);
  const model = getModel(sel.category!, sel.brand!, sel.model!)!;
  const variantIndex = Math.max(0, model.variants.findIndex((v) => slug(v) === sel.variant));

  // No backend yet: these are generated placeholders. See data/sampleDeals.ts.
  const deals = sampleDeals({
    key: [sel.brand, sel.model, sel.variant, sel.state, sel.city].join("|"),
    form: vehicleForm(sel),
    condition: sel.condition!,
    variantIndex,
  });

  return (
    <StepShell
      index={6}
      sel={sel}
      aside={false}
      title={`${d.condition} ${d.brand} ${d.model} in ${d.city}`}
      intro={`${d.variant} variant · ${d.city}, ${d.state}. Every offer in one view, priced the same way.`}
    >
      <DealsView
        deals={deals}
        editHref={hrefFor("/city", sel)}
        vehicle={{
          title: `${d.brand} ${d.model}`,
          variant: d.variant ?? "",
          place: `${d.city}, ${d.state}`,
          modelKey: modelKey(sel)!,
          condition: sel.condition!,
        }}
      />
    </StepShell>
  );
}
