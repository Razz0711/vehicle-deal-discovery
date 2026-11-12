import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { STEPS, describe, hrefFor, modelKey, vehicleKind, type Selection } from "@/lib/selection";
import { VehicleStage } from "./vehicles/VehicleStage";

type Row = { label: string; value?: string; path: string };

function rows(sel: Selection): Row[] {
  const d = describe(sel);
  return [
    { label: "Vehicle", value: d.category, path: "/" },
    { label: "State", value: d.state, path: "/state" },
    { label: "City", value: d.city, path: "/city" },
    { label: "Condition", value: d.condition, path: "/condition" },
    { label: "Brand", value: d.brand, path: "/brand" },
    { label: "Model", value: d.model ? d.model + (d.variant ? " · " + d.variant : "") : undefined, path: "/model" },
  ].filter((r) => r.value);
}

/** Desktop: a quiet list of answers, each editable. */
function SummaryList({ sel }: { sel: Selection }) {
  const list = rows(sel);
  if (!list.length) return null;
  return (
    <dl className="surface divide-y divide-hairline rounded-3xl px-1">
      {list.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-3 px-4 py-2">
          <div className="min-w-0">
            <dt className="eyebrow text-ash" style={{ fontSize: 10.5 }}>{r.label}</dt>
            <dd className="truncate font-medium">{r.value}</dd>
          </div>
          <Link href={hrefFor(r.path, sel)} className="flex min-h-11 items-center rounded-full px-3 text-sm text-fog transition-colors hover:bg-white/5 hover:text-ember">
            Edit<span className="sr-only"> {r.label}</span>
          </Link>
        </div>
      ))}
    </dl>
  );
}

/** Mobile: a swipeable row of answer chips; tapping one edits it. */
function SummaryChips({ sel }: { sel: Selection }) {
  const list = rows(sel);
  if (!list.length) return null;
  return (
    <nav aria-label="Your choices" className="no-scrollbar -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 lg:hidden">
      {list.map((r) => (
        <Link key={r.label} href={hrefFor(r.path, sel)} className="flex min-h-11 flex-none items-center gap-2 rounded-full bg-white/[0.06] px-4 text-sm ring-1 ring-hairline">
          <span className="text-ash">{r.label}</span>
          <span className="font-medium">{r.value}</span>
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
  stage = true,
  wide = false,
}: {
  index: number;
  sel: Selection;
  title: string;
  intro?: string;
  children: React.ReactNode;
  stage?: boolean;
  wide?: boolean;
}) {
  const step = STEPS[index];
  const prev = index > 0 ? STEPS[index - 1] : undefined;
  const next = index < STEPS.length - 1 ? STEPS[index + 1] : undefined;
  const canContinue = step.done(sel);
  const showAside = stage && !wide;

  return (
    <div className="flex min-h-[calc(100vh-104px)] flex-col">
      <main className="flex-1">
        <div className={`mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-8 sm:px-8 sm:pt-14 ${showAside ? "lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-14" : ""}`}>
          <div className="min-w-0">
            {index > 0 && <SummaryChips sel={sel} />}
            <p className="eyebrow rise text-ember">
              Step {index + 1} · {step.label}
            </p>
            <h1 className="display rise mt-4 text-[2.5rem] font-extrabold sm:text-6xl" style={{ animationDelay: "60ms" }}>
              {title}
            </h1>
            {intro && (
              <p className="rise mt-5 max-w-xl text-lg text-fog" style={{ animationDelay: "120ms" }}>
                {intro}
              </p>
            )}
            <div className="mt-10">{children}</div>
          </div>

          {showAside && (
            <aside className="hidden flex-col gap-3 lg:sticky lg:top-[120px] lg:flex lg:self-start">
              {sel.category && <VehicleStage kind={vehicleKind(sel)} modelKey={modelKey(sel)} label={describe(sel).category} />}
              <SummaryList sel={sel} />
            </aside>
          )}
        </div>
      </main>

      {(prev || (next && canContinue)) && (
        <footer className="glass sticky bottom-0 z-20 border-t border-hairline">
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
                  className="group flex min-h-12 items-center gap-2 rounded-full bg-ember pl-6 pr-5 font-semibold text-void shadow-[0_10px_30px_-10px_rgb(242_118_50/0.8)] transition hover:bg-[#ff8a4a]"
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
