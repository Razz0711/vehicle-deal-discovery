"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

/**
 * The living background behind every page. It lives in the root layout, so
 * it persists across navigation and its light glides to a new position for
 * each step instead of resetting.
 *
 * Cost is kept low: glows are plain radial gradients moved with transforms
 * (no blur filters), particles are ~40 dots on one canvas, and everything
 * stops when the tab is hidden or reduced motion is on.
 */

const STEP_PATHS = ["/explore", "/state", "/city", "/condition", "/brand", "/model", "/deals"];

/** Where the two key lights sit for each step, in viewport units. */
const LIGHTS: { a: [number, number]; b: [number, number] }[] = [
  { a: [8, -6], b: [62, 48] },
  { a: [-12, 4], b: [70, 30] },
  { a: [20, -10], b: [58, 58] },
  { a: [4, 8], b: [66, 20] },
  { a: [-6, -4], b: [74, 52] },
  { a: [16, 2], b: [54, 36] },
  { a: [30, -14], b: [62, 64] },
];

export function Backdrop() {
  const path = usePathname();
  const step = Math.max(0, STEP_PATHS.indexOf(path));
  const light = LIGHTS[step];
  const reduce = useReducedMotion();

  // Pointer parallax on the grid layer.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 40, damping: 18 });
  const sy = useSpring(py, { stiffness: 40, damping: 18 });
  const gx = useTransform(sx, (v) => v * -14);
  const gy = useTransform(sy, (v) => v * -14);

  useEffect(() => {
    if (reduce) return;
    const move = (e: PointerEvent) => {
      px.set(e.clientX / window.innerWidth - 0.5);
      py.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [px, py, reduce]);

  const glide = { duration: 2.2, ease: [0.2, 0.7, 0.2, 1] as const };

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void">
      {/* Key lights */}
      <motion.div className="absolute left-0 top-0 h-[90vh] w-[90vh]" animate={{ x: light.a[0] + "vw", y: light.a[1] + "vh" }} transition={glide}>
        <div className="drift-a h-full w-full rounded-full bg-[radial-gradient(closest-side,rgb(242_118_50/0.20),rgb(242_118_50/0.06)_45%,transparent_72%)]" />
      </motion.div>
      <motion.div className="absolute left-0 top-0 h-[80vh] w-[80vh]" animate={{ x: light.b[0] + "vw", y: light.b[1] + "vh" }} transition={glide}>
        <div className="drift-b h-full w-full rounded-full bg-[radial-gradient(closest-side,rgb(148_163_184/0.12),rgb(148_163_184/0.04)_50%,transparent_72%)]" />
      </motion.div>

      {/* Technical grid, faded toward the edges */}
      <motion.div
        style={{ x: gx, y: gy }}
        className="absolute -inset-8 opacity-[0.55] [background-image:linear-gradient(rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.035)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,black,transparent)]"
      />

      <Particles disabled={!!reduce} />

      {/* Floor and vignette */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-void to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(0_0_0/0.55))]" />
    </div>
  );
}

function Particles({ disabled }: { disabled: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    const count = window.innerWidth < 640 ? 22 : 42;
    const dots = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.6 + Math.random() * 1.4,
      v: 0.00004 + Math.random() * 0.00012,
      a: 0.15 + Math.random() * 0.45,
      t: Math.random() * Math.PI * 2,
      warm: Math.random() < 0.3,
    }));

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.y -= d.v * dt;
        d.t += dt * 0.0012;
        if (d.y < -0.02) {
          d.y = 1.02;
          d.x = Math.random();
        }
        const alpha = d.a * (0.6 + 0.4 * Math.sin(d.t));
        ctx.beginPath();
        ctx.fillStyle = d.warm ? `rgba(242,118,50,${alpha})` : `rgba(245,245,244,${alpha * 0.7})`;
        ctx.arc(d.x * w + Math.sin(d.t) * 6, d.y * h, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    resize();
    window.addEventListener("resize", resize);

    if (disabled) {
      draw(0);
      return () => window.removeEventListener("resize", resize);
    }

    let raf = 0;
    let last = performance.now();
    // ~30 frames a second is plenty for slow-drifting dots and halves the work.
    const loop = (now: number) => {
      if (now - last >= 32) {
        draw(Math.min(now - last, 66));
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    raf = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [disabled]);

  return <canvas ref={ref} className="absolute inset-0" />;
}
