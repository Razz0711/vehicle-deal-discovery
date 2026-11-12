"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { CATEGORIES, type CategoryId } from "@/data/categories";
import { change, hrefFor, vehicleKind, type Selection } from "@/lib/selection";
import { VehiclePhoto } from "../vehicles/VehiclePhoto";

/** Bento placement: cars lead, the rest share the grid. */
const SPAN: Record<CategoryId, string> = {
  cars: "col-span-2 row-span-2 min-h-[300px] lg:col-span-2 lg:row-span-2",
  bikes: "col-span-1 min-h-[190px]",
  scooters: "col-span-1 min-h-[190px]",
  ev: "col-span-1 min-h-[190px]",
  commercial: "col-span-1 min-h-[190px]",
};

/**
 * Step 1. Large photographic cards in a bento grid. Choosing one lights its
 * border, sweeps light across it, then expands it to fill the screen
 * (a shared layout transition) before the next step loads.
 */
export function CategoryPicker({ sel }: { sel: Selection }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [picked, setPicked] = useState<CategoryId | undefined>();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    CATEGORIES.forEach((c) => router.prefetch(hrefFor("/state", change(sel, "category", c.id))));
    return () => clearTimeout(timer.current);
  }, [router, sel]);

  function choose(id: CategoryId) {
    if (picked) return;
    setPicked(id);
    const go = () => router.push(hrefFor("/state", change(sel, "category", id)));
    if (reduce) go();
    else timer.current = setTimeout(go, 900);
  }

  const pickedCat = CATEGORIES.find((c) => c.id === picked);

  return (
    <>
      <ul className="grid auto-rows-[minmax(190px,auto)] grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {CATEGORIES.map((c, i) => {
          const current = sel.category === c.id;
          return (
            <motion.li
              key={c.id}
              className={SPAN[c.id]}
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
            >
              {picked === c.id ? (
                <div className="h-full w-full rounded-[28px]" aria-hidden />
              ) : (
                <motion.button
                  layoutId={"card-" + c.id}
                  type="button"
                  onClick={() => choose(c.id)}
                  aria-label={`${c.label}: ${c.blurb}`}
                  aria-pressed={current}
                  disabled={!!picked}
                  whileTap={{ scale: 0.985 }}
                  className={`group relative flex h-full w-full overflow-hidden rounded-[28px] text-left transition-shadow duration-500 ${current ? "is-selected" : "surface hover:shadow-[0_0_0_1px_rgb(242_118_50/0.5),0_30px_60px_-30px_rgb(242_118_50/0.45)]"}`}
                >
                  <CardFace id={c.id} label={c.label} blurb={c.blurb} index={i} large={c.id === "cars"} current={current} />
                </motion.button>
              )}
            </motion.li>
          );
        })}
      </ul>
      <p className="mt-5 text-sm text-ash" aria-live="polite">
        {pickedCat ? `${pickedCat.label} selected. Loading states…` : "Choose a vehicle type to begin."}
      </p>

      <AnimatePresence>
        {pickedCat && (
          <motion.div className="fixed inset-0 z-40 p-3 sm:p-6" initial={{ backgroundColor: "rgba(10,10,11,0)" }} animate={{ backgroundColor: "rgba(10,10,11,0.85)" }}>
            <motion.div layoutId={"card-" + pickedCat.id} className="sweep is-selected relative flex h-full w-full overflow-hidden rounded-[32px]" transition={{ type: "spring", stiffness: 70, damping: 18 }}>
              <CardFace id={pickedCat.id} label={pickedCat.label} blurb={pickedCat.blurb} index={CATEGORIES.indexOf(pickedCat)} large current hero />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function CardFace({
  id,
  label,
  blurb,
  index,
  large,
  current,
  hero = false,
}: {
  id: CategoryId;
  label: string;
  blurb: string;
  index: number;
  large: boolean;
  current: boolean;
  hero?: boolean;
}) {
  return (
    <>
      <span className="absolute inset-0">
        <VehiclePhoto
          kind={vehicleKind({ category: id })}
          sizes={large ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
          priority={large}
          showNote={large || hero}
          className="transition-transform duration-[1200ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.06]"
        />
      </span>
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-void via-void/35 to-transparent" />
      <span className="relative mt-auto flex w-full items-end justify-between gap-3 p-5 sm:p-6">
        <span className="min-w-0">
          <span className="eyebrow block text-ember tnum">{String(index + 1).padStart(2, "0")}</span>
          <span className={`display mt-2 block font-extrabold ${hero ? "text-5xl sm:text-7xl" : large ? "text-4xl sm:text-5xl" : "text-2xl sm:text-[1.7rem]"}`}>{label}</span>
          <span className={`mt-1.5 block text-fog ${large ? "text-base" : "hidden text-sm sm:block"}`}>{blurb}</span>
        </span>
        <span
          aria-hidden
          className={`flex h-11 w-11 flex-none items-center justify-center rounded-full transition-all duration-300 ${
            current || hero ? "bg-ember text-void" : "bg-white/10 text-bright group-hover:bg-ember group-hover:text-void"
          }`}
        >
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
    </>
  );
}
