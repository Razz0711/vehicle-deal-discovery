import { CategoryPicker } from "@/components/steps/CategoryPicker";
import { StepShell } from "@/components/StepShell";
import { loadStep } from "@/lib/guard";
import type { RawParams } from "@/lib/selection";
import { SITE } from "@/lib/site";

export default async function Page({ searchParams }: { searchParams: Promise<RawParams> }) {
  const sel = await loadStep(0, searchParams);
  return (
    <StepShell index={0} sel={sel} stage={false} title="What are you looking to buy?" intro={SITE.tagline + " Start by choosing a vehicle type."}>
      <CategoryPicker sel={sel} />
    </StepShell>
  );
}
