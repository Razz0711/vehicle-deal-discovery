"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { Check } from "lucide-react";
import { CATEGORIES, type CategoryId } from "@/data/categories";
import { change, hrefFor, vehicleKind, type Selection } from "@/lib/selection";
import { VehiclePhoto } from "../vehicles/VehiclePhoto";

/** How far each photograph in the opening line-up drifts with the pointer. */
const DEPTH: Record<CategoryId, number> = { cars: 1, bikes: 0.55, scooters: 0.4, ev: 0.8, commercial: 0.3 };

export function CategoryPicker({ sel }: { sel: Selection }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [picked, setPicked] = useState<CategoryId | undefined>(sel.category);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Subtle parallax: the line-up drifts a few pixels with the pointer.
  const pointer = useMotionValue(0);
  const drift = useSpring(pointer, { stiffness: 60, damping: 20 });

  useEffect(() => {
    CATEGORIES.forEach((c) => router.prefetch(hrefFor("/state", change(sel, "category", c.id))));
    return () => clearTimeout(timer.current);
  }, [router, sel]);

  function choose(id: CategoryId) {
    if (leaving) return;
    setPicked(id);
    setLeaving(true);
    const go = () => router.push(hrefFor("/state", change(sel, "category", id)));
    if (reduce) go();
    else timer.current = setTimeout(go, 800);
  }

  return (
    <div>
      {/* Main visual area. Line-up of five photographs; the chosen one grows
          to fill the frame (shared layout animation), then pushes in as the
          next step loads. */}
      <div
        className="relative h-52 overflow-hidden rounded-md border border-line bg-ink-2 sm:h-72"
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          pointer.set((e.clientX - box.left) / box.width - 0.5);
        }}
        onPointerLeave={() => pointer.set(0)}
      >
        <AnimatePresence mode="popLayout">
          {picked ? (
            <motion.div
              key={"focus-" + picked}
              layoutId={"vehicle-" + picked}
              className="absolute inset-0 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 22 }}
            >
              <motion.div className="absolute inset-0" animate={leaving ? { scale: 1.15, opacity: [1, 1, 0.4] } : { scale: 1, opacity: 1 }} transition={{ duration: 0.8, ease: "easeIn" }}>
                <VehiclePhoto kind={vehicleKind({ category: picked })} sizes="(min-width: 1152px) 1100px, 100vw" priority />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="lineup" className="absolute inset-0 flex items-center gap-2 p-3 sm:gap-3 sm:p-4" exit={{ opacity: 0 }}>
              {CATEGORIES.map((c, i) => (
                <LineupPhoto key={c.id} id={c.id} index={i} drift={drift} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {CATEGORIES.map((c, i) => {
          const active = picked === c.id;
          return (
            <motion.li key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.06, duration: 0.4 }}>
              <motion.button
                type="button"
                onClick={() => choose(c.id)}
                aria-pressed={active}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                className={`group flex h-full w-full flex-col overflow-hidden rounded-md border text-left transition-colors ${
                  active ? "border-paper bg-paper text-ink" : "border-line bg-ink-2 hover:border-sky"
                }`}
              >
                <span className="relative block h-24 w-full overflow-hidden sm:h-28">
                  <span className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
                    <VehiclePhoto kind={vehicleKind({ category: c.id })} sizes="(min-width: 1280px) 220px, (min-width: 768px) 33vw, 50vw" compact />
                  </span>
                  {active && (
                    <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-paper text-blue-deep">
                      <Check size={18} aria-hidden />
                    </span>
                  )}
                </span>
                <span className="block p-4">
                  <span className="display block text-xl font-bold" style={{ fontStretch: "112%" }}>
                    {c.label}
                  </span>
                  <span className={`mt-1 block text-sm ${active ? "text-slate" : "text-mist"}`}>{c.blurb}</span>
                </span>
              </motion.button>
            </motion.li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm text-mist" aria-live="polite">
        {leaving && picked ? "Taking you to the next step…" : "Choosing a vehicle takes you straight to the next step."}
      </p>
    </div>
  );
}

function LineupPhoto({ id, index, drift }: { id: CategoryId; index: number; drift: MotionValue<number> }) {
  const x = useTransform(drift, (v: number) => v * 28 * DEPTH[id]);
  return (
    <motion.div
      layoutId={"vehicle-" + id}
      style={{ x }}
      className={`relative aspect-[4/3] min-w-0 flex-1 self-center overflow-hidden rounded ${index > 2 ? "hidden sm:block" : ""}`}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.09, type: "spring", stiffness: 80, damping: 16 }}
    >
      <VehiclePhoto kind={vehicleKind({ category: id })} sizes="(min-width: 640px) 20vw, 33vw" compact priority />
    </motion.div>
  );
}
