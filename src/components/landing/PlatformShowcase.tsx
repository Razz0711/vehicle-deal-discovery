"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { CATALOG } from "@/data/catalog";
import { CATEGORIES } from "@/data/categories";
import { hrefFor, vehicleKind } from "@/lib/selection";
import { VehiclePhoto } from "../vehicles/VehiclePhoto";

/**
 * A live window onto step one of the real application: the same five
 * categories, the same photographs, and links that enter the journey with
 * that category already chosen.
 */
export function PlatformShowcase() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!auto || reduce) return;
    const t = setInterval(() => setActive((i) => (i + 1) % CATEGORIES.length), 4500);
    return () => clearInterval(t);
  }, [auto, reduce]);

  const cat = CATEGORIES[active];
  const brands = CATALOG[cat.id];
  const models = brands.reduce((n, b) => n + b.models.length, 0);

  return (
    <div className="surface overflow-hidden rounded-3xl" onPointerEnter={() => setAuto(false)} onFocus={() => setAuto(false)}>
      <div role="tablist" aria-label="Vehicle categories" className="no-scrollbar flex gap-1.5 overflow-x-auto border-b border-hairline p-3">
        {CATEGORIES.map((c, i) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls="platform-panel"
            onClick={() => {
              setAuto(false);
              setActive(i);
            }}
            className={`min-h-11 flex-none rounded-full px-4 text-sm font-medium transition-colors ${i === active ? "bg-bright text-void" : "text-fog hover:bg-white/5 hover:text-bright"}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div id="platform-panel" role="tabpanel" className="grid lg:grid-cols-[1.25fr_1fr]">
        <div className="relative h-56 overflow-hidden sm:h-80 lg:h-[420px]">
          <AnimatePresence initial={false}>
            <motion.div key={cat.id} className="absolute inset-0" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}>
              <VehiclePhoto kind={vehicleKind({ category: cat.id })} sizes="(min-width: 1024px) 55vw, 100vw" />
            </motion.div>
          </AnimatePresence>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-coal via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-coal" />
        </div>

        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8" aria-live="polite">
          <p className="eyebrow text-ember">Step 1 of 7 · Vehicle</p>
          <h3 className="display text-3xl font-extrabold sm:text-4xl">{cat.label}</h3>
          <p className="text-fog">{cat.blurb}.</p>
          <p className="tnum text-sm text-ash">
            {brands.length} brands and {models} models in the starter catalogue
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link href={hrefFor("/state", { category: cat.id })} className="group flex min-h-12 items-center gap-2 rounded-full bg-ember pl-6 pr-5 font-semibold text-void transition hover:bg-[#ff8a4a] active:scale-[0.98]">
              Start with {cat.label}
              <ArrowRight size={18} aria-hidden className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/explore" className="flex min-h-12 items-center rounded-full px-5 font-medium text-fog ring-1 ring-hairline-strong transition hover:bg-white/5 hover:text-bright">
              See all categories
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
