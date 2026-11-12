import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import { SITE } from "@/lib/site";
import { STEPS, describe, hrefFor, modelKey, vehicleKind, type Selection } from "@/lib/selection";
import { VehicleStage } from "./vehicles/VehicleStage";

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" aria-hidden>
      <rect x="2" y="17" width="6" height="9" fill="none" stroke="#8FB4FF" strokeWidth="1.6" strokeDasharray="2.5 2" />
      <rect x="11" y="10" width="6" height="16" fill="none" stroke="#8FB4FF" strokeWidth="1.6" />
      <rect x="20" y="2" width="6" height="24" fill="#8FB4FF" />
    </svg>
  );
}

function Progress({ index, sel }: { index: number; sel: Selection }) {
  return (
    <nav aria-label="Progress" className="border-b border-line bg-ink-3">
      <ol className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-3 sm:px-6">
        {STEPS.map((step, i) => {
          const reachable = STEPS.slice(0, i).every((s) => s.done(sel));
          const state = i === index ? "current" : i < index || (reachable && step.done(sel) && i !== STEPS.length - 1) ? "done" : "todo";
          const inner = (
            <span className="flex items-center gap-2 whitespace-nowrap">
              <span
                className={`flex h-6 w-6 flex-none items-center justify-center rounded-full font-mono text-xs ${
                  state === "current" ? "bg-paper text-ink" : state === "done" ? "bg-blue text-white" : "border border-edge text-mist"
                }`}
              >
                {state === "done" ? <Check size={14} aria-hidden /> : i + 1}
              </span>
              <span className={`text-sm ${state === "current" ? "font-semibold text-white" : "text-mist"}`}>{step.label}</span>
            </span>
          );
          return (
            <li key={step.path} className="flex items-center gap-1" aria-current={state === "current" ? "step" : undefined}>
              {reachable && i !== index ? (
                <Link href={hrefFor(step.path, sel)} className="rounded px-2 py-2 hover:bg-ink-2">
                  {inner}
                </Link>
              ) : (
                <span className="px-2 py-2">{inner}</span>
              )}
              {i < STEPS.length - 1 && <span aria-hidden className="h-px w-4 bg-edge sm:w-6" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Summary({ sel }: { sel: Selection }) {
  const d = describe(sel);
  const rows: [string, string | undefined, string][] = [
    ["Vehicle", d.category, "/"],
    ["State", d.state, "/state"],
    ["City", d.city, "/city"],
    ["Condition", d.condition, "/condition"],
    ["Brand", d.brand, "/brand"],
    ["Model", d.model ? d.model + (d.variant ? " · " + d.variant : "") : undefined, "/model"],
  ];
  const chosen = rows.filter((r) => r[1]);
  if (!chosen.length) return null;
  return (
    <dl className="divide-y divide-line rounded-md border border-line">
      {chosen.map(([label, value, path]) => (
        <div key={label} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="min-w-0">
            <dt className="eyebrow text-mist" style={{ fontSize: 11 }}>
              {label}
            </dt>
            <dd className="truncate font-medium">{value}</dd>
          </div>
          <Link href={hrefFor(path, sel)} className="flex min-h-11 items-center text-sm font-medium text-sky hover:text-white">
            Change<span className="sr-only"> {label}</span>
          </Link>
        </div>
      ))}
    </dl>
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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-ink">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="display flex items-center gap-2.5 text-lg font-bold" style={{ fontStretch: "112%" }}>
            <Logo />
            {SITE.name}
          </Link>
          <Link href="/" className="flex min-h-11 items-center gap-2 text-sm text-soft hover:text-white">
            <RotateCcw size={16} aria-hidden />
            Start over
          </Link>
        </div>
      </header>
      <Progress index={index} sel={sel} />

      <main className="grid-floor flex-1">
        <div className={`mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-12 ${stage && !wide ? "lg:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
          <div className="min-w-0">
            <p className="eyebrow text-sky">
              Step {index + 1} of {STEPS.length}
            </p>
            <h1 className="display mt-3 text-4xl font-extrabold sm:text-5xl">{title}</h1>
            {intro && <p className="mt-4 max-w-xl text-lg text-soft">{intro}</p>}
            <div className="mt-8">{children}</div>
            {stage && !wide && (
              <div className="mt-10 lg:hidden">
                <Summary sel={sel} />
              </div>
            )}
          </div>
          {stage && !wide && (
            <aside className="order-first flex flex-col gap-4 lg:order-none lg:sticky lg:top-6 lg:self-start">
              {sel.category && <VehicleStage kind={vehicleKind(sel)} modelKey={modelKey(sel)} />}
              <div className="hidden lg:block">
                <Summary sel={sel} />
              </div>
            </aside>
          )}
        </div>
      </main>

      <footer className="sticky bottom-0 border-t border-line bg-ink-3/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {prev ? (
            <Link href={hrefFor(prev.path, sel)} className="flex min-h-12 items-center gap-2 rounded border border-edge px-4 font-medium hover:border-sky">
              <ArrowLeft size={18} aria-hidden />
              Back
            </Link>
          ) : (
            <span />
          )}
          {next &&
            (canContinue ? (
              <Link href={hrefFor(next.path, sel)} className="flex min-h-12 items-center gap-2 rounded bg-blue px-5 font-semibold text-white hover:bg-blue-deep">
                Next: {next.label}
                <ArrowRight size={18} aria-hidden />
              </Link>
            ) : (
              <span className="flex min-h-12 items-center gap-2 text-right text-sm text-mist" role="status">
                Choose {index === 5 ? "a model and variant" : "an option"} to continue
              </span>
            ))}
        </div>
      </footer>
    </div>
  );
}
