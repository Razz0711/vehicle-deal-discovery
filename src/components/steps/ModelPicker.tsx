"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import type { Model } from "@/data/catalog";
import { change, hrefFor, type Selection } from "@/lib/selection";
import { slug } from "@/lib/slug";

/**
 * Model first, then variant. Every choice is written to the URL straight
 * away (router.replace), so a refresh keeps it. Continue stays disabled
 * until both are chosen.
 */
export function ModelPicker({ sel, models, brandName }: { sel: Selection; models: Model[]; brandName: string }) {
  const router = useRouter();
  const model = models.find((m) => m.id === sel.model);
  const ready = !!model && !!sel.variant;

  function pickModel(m: Model) {
    let next = change(sel, "model", m.id);
    // A model with a single variant needs no second question.
    if (m.variants.length === 1) next = change(next, "variant", slug(m.variants[0]));
    router.replace(hrefFor("/model", next), { scroll: false });
  }

  function pickVariant(v: string) {
    router.replace(hrefFor("/model", change(sel, "variant", slug(v))), { scroll: false });
  }

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="models-h">
        <h2 id="models-h" className="eyebrow mb-3 text-mist">
          {brandName} models
        </h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {models.map((m) => {
            const active = m.id === sel.model;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => pickModel(m)}
                  aria-pressed={active}
                  className={`flex min-h-14 w-full items-center justify-between gap-3 rounded border px-4 py-3 text-left transition-colors ${
                    active ? "border-paper bg-paper text-ink" : "border-line bg-ink-2 hover:border-sky"
                  }`}
                >
                  <span>
                    <span className="block font-medium">{m.name}</span>
                    <span className={`block text-sm ${active ? "text-slate" : "text-mist"}`}>
                      {m.variants.length === 1 ? "One variant" : m.variants.length + " variants"}
                    </span>
                  </span>
                  {active && <Check size={18} aria-hidden className="flex-none text-blue-deep" />}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {model ? (
        <motion.section key={model.id} aria-labelledby="variants-h" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h2 id="variants-h" className="eyebrow mb-3 text-mist">
            {model.name} variants
          </h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Variant">
            {model.variants.map((v) => {
              const active = slug(v) === sel.variant;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => pickVariant(v)}
                  aria-pressed={active}
                  className={`min-h-12 rounded border px-5 font-medium transition-colors ${
                    active ? "border-paper bg-paper text-ink" : "border-edge hover:border-sky"
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </motion.section>
      ) : (
        <p className="rounded-md border border-dashed border-edge p-5 text-soft">Choose a model to see its variants.</p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={!ready}
          onClick={() => router.push(hrefFor("/deals", sel))}
          className="flex min-h-12 items-center gap-2 rounded bg-blue px-6 font-semibold text-white hover:bg-blue-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          See deals
          <ArrowRight size={18} aria-hidden />
        </button>
        {!ready && <span className="text-sm text-mist">{model ? "Choose a variant to continue." : "Choose a model and a variant to continue."}</span>}
      </div>
    </div>
  );
}
