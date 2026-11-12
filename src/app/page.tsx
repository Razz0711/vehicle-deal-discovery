import { CategoryPicker } from "@/components/steps/CategoryPicker";
import { StepShell } from "@/components/StepShell";
import { loadStep } from "@/lib/guard";
import type { RawParams } from "@/lib/selection";
import { SITE } from "@/lib/site";

export default async function Page({ searchParams }: { searchParams: Promise<RawParams> }) {
  const sel = await loadStep(0, searchParams);
  return (
    <StepShell index={0} sel={sel} aside={false} title="What will you drive next?" intro={SITE.tagline + " Start with the kind of vehicle you want."}>
      <CategoryPicker sel={sel} />
    </StepShell>
  );
}
