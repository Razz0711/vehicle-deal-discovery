"use client";

import { MotionConfig } from "motion/react";

/** `reducedMotion="user"` makes every Motion animation honour the OS setting. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
