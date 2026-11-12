"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { showcase } from "@/data/showcase";
import { RemoteImage } from "../site/RemoteImage";

/**
 * The moving automotive scene behind the hero: vehicles gliding past at
 * three depths, passing lights, and one prominent vehicle hovering in front.
 *
 * All motion is CSS transforms on a handful of elements (no per-frame
 * JavaScript). Scroll adds a small depth shift per layer. With reduced
 * motion the gliding vehicles and lights are removed and the rest is still.
 */

type Glider = { id: string; top: string; width: string; dir: "left" | "right"; dur: number; delay: number; depth: "far" | "mid"; mobile?: boolean };

const GLIDERS: Glider[] = [
  { id: "supercar", top: "9%", width: "clamp(150px,17vw,250px)", dir: "left", dur: 96, delay: -30, depth: "far", mobile: true },
  { id: "suv", top: "58%", width: "clamp(160px,19vw,280px)", dir: "right", dur: 118, delay: -70, depth: "far" },
  { id: "superbike", top: "24%", width: "clamp(170px,20vw,300px)", dir: "right", dur: 84, delay: -52, depth: "mid" },
  { id: "sports", top: "70%", width: "clamp(200px,26vw,400px)", dir: "left", dur: 72, delay: -14, depth: "mid", mobile: true },
  { id: "ev", top: "40%", width: "clamp(150px,16vw,240px)", dir: "left", dur: 132, delay: -96, depth: "far" },
];

function Plate({ id, sizes, priority = false }: { id: string; sizes: string; priority?: boolean }) {
  return (
    <div className="plate relative aspect-[16/10] w-full">
      <RemoteImage photo={showcase(id).photo} sizes={sizes} priority={priority} decorative />
    </div>
  );
}

export function HeroScene() {
  const { scrollY } = useScroll();
  const farY = useTransform(scrollY, [0, 900], [0, 140]);
  const midY = useTransform(scrollY, [0, 900], [0, 70]);
  const mainY = useTransform(scrollY, [0, 900], [0, -40]);

  const layer = (depth: Glider["depth"]) =>
    GLIDERS.filter((g) => g.depth === depth).map((g) => (
      <div
        key={g.id}
        className={`absolute left-0 ${g.dir === "left" ? "glide-left" : "glide-right"} ${g.mobile ? "" : "hidden md:block"} ${depth === "far" ? "opacity-30 blur-[1.5px]" : "opacity-55"}`}
        style={{ top: g.top, width: g.width, ["--dur" as string]: g.dur + "s", ["--delay" as string]: g.delay + "s" }}
      >
        <div className="hover-y" style={{ ["--dur" as string]: 7 + (g.dur % 5) + "s" }}>
          <Plate id={g.id} sizes="(min-width: 768px) 26vw, 50vw" />
        </div>
      </div>
    ));

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Showroom light from above and a warm floor */}
      <div className="absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(60%_80%_at_70%_0%,rgb(255_255_255/0.07),transparent_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(50%_70%_at_68%_100%,rgb(242_118_50/0.16),transparent_70%)]" />

      <motion.div style={{ y: farY }} className="absolute inset-0">
        {layer("far")}
      </motion.div>

      {/* Passing lights */}
      {[
        { top: "30%", dur: 8, delay: 0, w: "32vw" },
        { top: "64%", dur: 11, delay: -4, w: "24vw" },
        { top: "82%", dur: 9, delay: -7, w: "40vw" },
      ].map((l) => (
        <span
          key={l.top}
          className="light-pass absolute left-0 h-px bg-gradient-to-r from-transparent via-ember/70 to-transparent"
          style={{ top: l.top, width: l.w, ["--dur" as string]: l.dur + "s", ["--delay" as string]: l.delay + "s" }}
        />
      ))}

      <motion.div style={{ y: midY }} className="absolute inset-0">
        {layer("mid")}
      </motion.div>

      {/* Keeps the headline readable while vehicles pass behind it */}
      <div className="absolute inset-0 bg-gradient-to-b from-void/85 via-void/55 to-void lg:bg-gradient-to-r lg:from-void lg:via-void/75 lg:to-transparent" />

      {/* The prominent vehicle */}
      <motion.div style={{ y: mainY }} className="absolute bottom-[4%] left-1/2 w-[min(118vw,560px)] -translate-x-1/2 lg:bottom-[10%] lg:left-auto lg:right-[-4%] lg:w-[min(58vw,860px)] lg:translate-x-0">
        <motion.div initial={{ opacity: 0, x: 90, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 1.4, ease: [0.2, 0.7, 0.2, 1], delay: 0.15 }}>
          <div className="hover-y" style={{ ["--dur" as string]: "10s" }}>
            <Plate id="sedan" sizes="(min-width: 1024px) 58vw, 118vw" priority />
          </div>
          {/* Soft pool of light on the floor beneath it */}
          <div className="mx-auto -mt-[7%] h-10 w-3/5 rounded-[100%] bg-[radial-gradient(closest-side,rgb(242_118_50/0.28),transparent)] blur-md" />
        </motion.div>
      </motion.div>
    </div>
  );
}

/** Two faint vehicles hovering at the edges of a content section. Wide screens only. */
export function EdgeFloaters({ left, right }: { left: string; right: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden xl:block">
      <div className="hover-y absolute -left-24 top-16 w-[340px] opacity-25" style={{ ["--dur" as string]: "11s" }}>
        <Plate id={left} sizes="340px" />
      </div>
      <div className="hover-y absolute -right-24 bottom-10 w-[380px] opacity-25" style={{ ["--dur" as string]: "13s", ["--delay" as string]: "-5s" }}>
        <Plate id={right} sizes="380px" />
      </div>
    </div>
  );
}
