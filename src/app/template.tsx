"use client";

import { motion } from "motion/react";

/**
 * A template re-mounts on every navigation, so each step fades and slides in. It starts
 * partly visible so the first paint is not delayed.
 * Reduced-motion users get an instant change (see Providers).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0.35, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}
