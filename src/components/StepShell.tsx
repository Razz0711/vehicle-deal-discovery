import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { STEPS, describe, hrefFor, modelKey, type Selection } from "@/lib/selection";
import { modelPhoto } from "@/data/vehiclePhotos";
import { VehicleStage } from "./vehicles/VehicleStage";

/**
 * Each answer has one of five states relative to the step being viewed.
 * "resets" marks a later answer that will be cleared if the customer changes
 * the answer on this step (for example city, while re-choosing the state).
 */
type Status = "chosen" | "current" | "pending" | "resets";
type Row = { label: string; value?: string; path: string; status: Status };

/** Which later answers depend on which step (by step index). */
const DEPENDENTS: Record<number, number[]> = { 0: [4, 5], 1: [2], 4: [5] };

function rows(sel: Selection, index: number): Row[] {
  const d = describe(sel);
  const base = [
    { label: "Vehicle", value: d.category, path: "/" },
    { label: "State", value: d.state, path: "/state" },
    { label: "City", value: d.city, path: "/city" },
    { label: "Condition", value: d.condition, path: "/condition" },
    { label: "Brand", value: d.brand, path: "/brand" },
    { label: "Model", value: d.model ? d.model + (d.variant ? " · " + d.variant : "") : undefined, path: "/model" },
  ];
  return base.map((r, i) => {
    let status: Status = r.value ? "chosen" : "pending";
    if (i === index) status = "current";
    else if (r.value && (DEPENDENTS[index] ?? []).includes(i)) status = "resets";
    return { ...r, status };
  });
}

/** Desktop: every step of the journey, with what is chosen, in progress and still to come. */
function SummaryList({ sel, index }: { sel: Selection; index: number }) {
  const current = STEPS[index].label.toLowerCase();
  return (
    <section aria-label="Your choices" className="surface rounded-3xl px-1 py-1">
      <dl className="divide-y divide-hairline">
        {rows(sel, index).map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 px-4 py-2.5" data-status={r.status}>
            <div className="min-w-0">
              <dt className={`eyebrow ${r.status === "current" ? "text-ember" : "text-ash"}`} style={{ fontSize: 10.5 }}>
                {r.label}
              </dt>
              <dd className={`break-words font-medium leading-snug ${r.status === "pending" ? "text-ash" : r.status === "resets" ? "text-fog" : ""}`}>
                {r.status === "pending" ? "Not chosen yet" : r.status === "current" ? (r.value ?? "Choosing now") : r.value}
                {r.status === "resets" && <span className="mt-0.5 block text-xs font-normal text-ash">Clears if you change the {current}</span>}
              </dd>
            </div>
            {r.status === "current" ? (
              <span className="flex-none rounded-full bg-ember-soft px-2.5 py-1 text-xs font-medium text-ember">{r.value ? "Editing" : "This step"}</span>
            ) : r.status !== "pending" ? (
              <Link href={hrefFor(r.path, sel)} className="flex min-h-11 flex-none items-center rounded-full px-3 text-sm text-fog transition-colors hover:bg-white/5 hover:text-ember">
                Edit<span className="sr-only"> {r.label}</span>
              </Link>
            ) : null}
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Mobile: a swipeable row of chips for the answers given so far; tapping one edits it. */
function SummaryChips({ sel, index }: { sel: Selection; index: number }) {
  const list = rows(sel, index).filter((r) => r.value && r.status !== "current");
  if (!list.length) return null;
  return (
    <nav aria-label="Your choices" className="no-scrollbar -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 lg:hidden">
      {list.map((r) => (
        <Link
          key={r.label}
          href={hrefFor(r.path, sel)}
          className={`flex min-h-11 flex-none items-center gap-2 rounded-full px-4 text-sm ring-1 ring-inset ${r.status === "resets" ? "text-ash ring-hairline" : "bg-white/[0.06] ring-hairline"}`}
        >
          <span className="text-ash">{r.label}</span>
          <span className={`font-medium ${r.status === "resets" ? "line-through decoration-ash/60" : ""}`}>{r.value}</span>
          {r.status === "resets" && <span className="text-xs">may clear</span>}
        </Link>
      ))}
    </nav>
  );
}

export function StepShell({
  index,
  sel,
  title,
  intro,
  children,
  aside = true,
}: {
  index: number;
  sel: Selection;
  title: string;
  intro?: string;
  children: React.ReactNode;
  /** Show the choices panel beside the content on wide screens. */
  aside?: boolean;
}) {
  const step = STEPS[index];
  const prev = index > 0 ? STEPS[index - 1] : undefined;
  const next = index < STEPS.length - 1 ? STEPS[index + 1] : undefined;
  const canContinue = step.done(sel);
  const d = describe(sel);
  const key = modelKey(sel);
  const showStage = index === 5 && !!modelPhoto(key);

  return (
    <div className="flex min-h-[calc(100vh-var(--header-h))] flex-col">
      <main className="flex-1">
        <div className={`mx-auto grid max-w-7xl gap-10 px-5 pb-10 pt-8 sm:px-8 sm:pt-12 ${aside ? "lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-14" : ""}`}>
          <div className="min-w-0">
            <SummaryChips sel={sel} index={index} />
            <p className="eyebrow rise text-ember">
              Step {index + 1} of {STEPS.length} · {step.label}
            </p>
            <h1 className="display rise mt-3 text-[2.25rem] font-extrabold sm:text-5xl" style={{ animationDelay: "60ms" }}>
              {title}
            </h1>
            {intro && (
              <p className={`rise mt-4 max-w-2xl text-lg text-fog ${index === 6 ? "hidden sm:block" : ""}`} style={{ animationDelay: "120ms" }}>
                {intro}
              </p>
            )}
            <div className="mt-8">{children}</div>
          </div>

          {/* The panel is capped to the space between the two bars and scrolls, so no row sits out of reach on a short screen. */}
          {aside && (
            <aside className="no-scrollbar hidden flex-col gap-3 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:flex lg:max-h-[calc(100vh-var(--header-h)-7.5rem)] lg:self-start lg:overflow-y-auto lg:rounded-3xl">
              {showStage && key && <VehicleStage modelKey={key} label={`${d.brand} ${d.model}`} />}
              <SummaryList sel={sel} index={index} />
            </aside>
          )}
        </div>
        <p className="mx-auto max-w-7xl px-5 pb-10 text-xs text-ash sm:px-8">
          Vehicle photographs come from Wikimedia Commons contributors.{" "}
          <Link href="/credits" className="underline underline-offset-4 hover:text-bright">
            Photo credits
          </Link>
        </p>
      </main>

      {(prev || (next && canContinue)) && (
        <footer className="bar sticky bottom-0 z-20 border-t border-hairline">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
            {prev ? (
              <Link href={hrefFor(prev.path, sel)} className="group flex min-h-12 items-center gap-2 rounded-full px-5 font-medium text-fog ring-1 ring-hairline-strong transition hover:bg-white/5 hover:text-bright">
                <ArrowLeft size={18} aria-hidden className="transition-transform group-hover:-translate-x-0.5" />
                Back
              </Link>
            ) : (
              <span />
            )}
            {next &&
              (canContinue ? (
                <Link
                  href={hrefFor(next.path, sel)}
                  className="group flex min-h-12 items-center gap-2 rounded-full bg-ember pl-6 pr-5 font-semibold text-void transition hover:bg-[#ff8a4a]"
                >
                  {index === STEPS.length - 2 ? "Discover deals" : `Continue to ${next.label.toLowerCase()}`}
                  <ArrowRight size={18} aria-hidden className="transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <span className="text-right text-sm text-ash" role="status">
                  {index === 5 ? "Choose a model and variant" : "Make a choice"} to continue
                </span>
              ))}
          </div>
        </footer>
      )}
    </div>
  );
}
