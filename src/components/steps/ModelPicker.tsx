"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import type { Model } from "@/data/catalog";
import { change, hrefFor, type Selection } from "@/lib/selection";
import { slug } from "@/lib/slug";

const EASE = [0.2, 0.7, 0.2, 1] as const;

/**
 * Model first, then variant. Every choice is written to the URL straight
 * away (router.replace), so a refresh keeps it. The footer's call to action
 * appears once both are chosen.
 */
export function ModelPicker({ sel, models, brandName }: { sel: Selection; models: Model[]; brandName: string }) {
  const router = useRouter();
  const model = models.find((m) => m.id === sel.model);

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
    <div className="flex flex-col gap-10">
      <section aria-labelledby="models-h">
        <h2 id="models-h" className="eyebrow mb-4 text-ash">
          {brandName} models
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {models.map((m, i) => {
            const active = m.id === sel.model;
            return (
              <motion.li key={m.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.45, ease: EASE }}>
                <button
                  type="button"
                  onClick={() => pickModel(m)}
                  aria-pressed={active}
                  className={`surface flex min-h-[72px] w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 ${active ? "is-selected" : ""}`}
                >
                  <span>
                    <span className="display block text-xl font-bold">{m.name}</span>
                    <span className="block text-sm text-ash">{m.variants.length === 1 ? "One variant" : m.variants.length + " variants"}</span>
                  </span>
                  <AnimatePresence>
                    {active && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-ember text-void">
                        <Check size={15} strokeWidth={3} aria-hidden />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </motion.li>
            );
          })}
        </ul>
      </section>

      <AnimatePresence mode="wait">
        {model ? (
          <motion.section key={model.id} aria-labelledby="variants-h" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}>
            <h2 id="variants-h" className="eyebrow mb-4 text-ash">
              {model.name} variants
            </h2>
            <div className="flex flex-wrap gap-2.5" role="group" aria-label="Variant">
              {model.variants.map((v) => {
                const active = slug(v) === sel.variant;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => pickVariant(v)}
                    aria-pressed={active}
                    className={`relative min-h-12 rounded-full px-6 font-semibold transition-colors ${active ? "text-void" : "bg-white/[0.06] text-bright ring-1 ring-hairline hover:bg-white/10"}`}
                  >
                    {active && <motion.span layoutId="variant-pill" className="absolute inset-0 rounded-full bg-ember" transition={{ type: "spring", stiffness: 300, damping: 28 }} />}
                    <span className="relative">{v}</span>
                  </button>
                );
              })}
            </div>
          </motion.section>
        ) : (
          <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-white/[0.03] p-5 text-fog ring-1 ring-hairline">
            Choose a model to see its variants.
          </motion.p>
        )}
      </AnimatePresence>

    </div>
  );
}
