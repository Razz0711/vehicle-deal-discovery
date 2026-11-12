"use client";

import { AnimatePresence, motion } from "motion/react";
import { VehiclePhoto } from "./VehiclePhoto";

/**
 * The framed photograph of the chosen model, shown beside the model step
 * once a model with its own photograph is picked. Keyed by model, so a new
 * choice wipes the old photograph out and reveals the next one.
 */
export function VehicleStage({ modelKey, label }: { modelKey: string; label: string }) {
  return (
    <figure className="surface relative m-0 h-36 flex-none overflow-hidden rounded-3xl">
      <AnimatePresence mode="popLayout" initial>
        <motion.div
          key={modelKey}
          className="absolute inset-0"
          initial={{ clipPath: "inset(0 0 0 100%)" }}
          animate={{ clipPath: "inset(0 0 0 0%)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <VehiclePhoto modelKey={modelKey} sizes="(min-width: 1024px) 360px, 100vw" />
        </motion.div>
      </AnimatePresence>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/85 via-void/10 to-transparent" />
      <figcaption className="display absolute bottom-4 left-5 right-5 text-xl font-bold">{label}</figcaption>
    </figure>
  );
}
