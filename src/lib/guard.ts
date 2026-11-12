import { redirect } from "next/navigation";
import { STEPS, firstIncomplete, hrefFor, parseSelection, type RawParams, type Selection } from "./selection";

/**
 * Server-side guard used by every step page. If the customer lands on a step
 * before finishing an earlier one (for example from an edited link), send
 * them to the first unanswered step, keeping whatever they already chose.
 */
export async function loadStep(index: number, searchParams: Promise<RawParams>): Promise<Selection> {
  const sel = parseSelection(await searchParams);
  const first = firstIncomplete(sel);
  if (first < index) redirect(hrefFor(STEPS[first].path, sel));
  return sel;
}
