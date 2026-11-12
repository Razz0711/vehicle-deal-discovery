"use client";

import { AnimatePresence, motion } from "motion/react";
import type { PhotoKind } from "@/data/vehiclePhotos";
import { VehiclePhoto } from "./VehiclePhoto";

/**
 * The framed photograph of the chosen vehicle. Keyed by kind and model, so a
 * new choice wipes the old photograph out and reveals the next one, which
 * then settles with a slow push-in.
 */
export function VehicleStage({ kind, modelKey, label }: { kind: PhotoKind; modelKey?: string; label?: string }) {
  const key = kind + (modelKey ?? "");
  return (
    <div className="surface relative h-40 overflow-hidden rounded-3xl xl:h-48">
      <AnimatePresence mode="popLayout" initial>
        <motion.div
          key={key}
          className="absolute inset-0"
          initial={{ clipPath: "inset(0 0 0 100%)" }}
          animate={{ clipPath: "inset(0 0 0 0%)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <motion.div className="absolute inset-0" initial={{ scale: 1.14 }} animate={{ scale: 1 }} transition={{ duration: 1.8, ease: [0.2, 0.7, 0.2, 1] }}>
            <VehiclePhoto kind={kind} modelKey={modelKey} sizes="(min-width: 1024px) 360px, 100vw" priority />
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/85 via-void/10 to-transparent" />
      {label && <span className="display absolute bottom-4 left-5 text-2xl font-bold">{label}</span>}
    </div>
  );
}
