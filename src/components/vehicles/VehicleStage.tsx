"use client";

import { AnimatePresence, motion } from "motion/react";
import type { PhotoKind } from "@/data/vehiclePhotos";
import { VehiclePhoto } from "./VehiclePhoto";

/**
 * The framed photograph of the chosen vehicle type. Keyed by kind, so
 * changing the category slides one photograph out and the next one in.
 * The photograph fills the frame and is clipped by it, so nothing floats;
 * a slow push-in keeps the frame alive after it lands.
 */
export function VehicleStage({ kind, modelKey, size = "md" }: { kind: PhotoKind; modelKey?: string; size?: "md" | "lg" }) {
  return (
    <div className={`relative overflow-hidden rounded-md border border-line bg-ink-2 ${size === "lg" ? "h-56 sm:h-72" : "h-44 sm:h-52"}`}>
      <AnimatePresence mode="popLayout" initial>
        <motion.div
          key={kind + (modelKey ?? "")}
          className="absolute inset-0"
          initial={{ x: "35%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-35%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
        >
          <motion.div className="absolute inset-0" initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 1.6, ease: [0.2, 0.7, 0.2, 1] }}>
            <VehiclePhoto kind={kind} modelKey={modelKey} sizes="(min-width: 1024px) 340px, 100vw" priority />
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink-3/60 to-transparent" />
    </div>
  );
}
