"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BadgeIndianRupee, Building2, Car, Layers, ListChecks, MapPin, MapPinned } from "lucide-react";
import { CATALOG } from "@/data/catalog";
import { CATEGORIES } from "@/data/categories";
import { REGIONS } from "@/data/locations";

const gujarat = REGIONS.find((r) => r.code === "GJ")!;
const hyundai = CATALOG.cars.find((b) => b.id === "hyundai")!;
const states = REGIONS.filter((r) => r.type === "state").length;
const uts = REGIONS.length - states;

/** The seven steps, each illustrated with entries from the real selection data. */
const STEPS = [
  { label: "Vehicle", Icon: Car, title: "Pick the kind of vehicle", text: "Five categories, from cars to commercial vehicles.", chips: CATEGORIES.map((c) => c.label) },
  { label: "State", Icon: MapPinned, title: "Choose your state", text: `Road tax and registration differ by state. All ${states} states and ${uts} union territories are listed.`, chips: ["Gujarat", "Maharashtra", "Karnataka", "Delhi", "Tamil Nadu"] },
  { label: "City", Icon: MapPin, title: "Narrow it to your city", text: "Offers are compared within the city you will buy in.", chips: gujarat.cities.slice(0, 5) },
  { label: "Condition", Icon: Layers, title: "New or used", text: "New vehicles compare on-road price. Used vehicles compare asking price, age and running.", chips: ["New", "Used"] },
  { label: "Brand", Icon: Building2, title: "Select a brand", text: "Only brands that make the kind of vehicle you chose.", chips: CATALOG.cars.slice(0, 6).map((b) => b.name) },
  { label: "Model", Icon: ListChecks, title: "Model and exact variant", text: "Prices differ a lot between variants, so the comparison is for the exact one.", chips: hyundai.models.slice(0, 4).map((m) => "Hyundai " + m.name) },
  { label: "Deals", Icon: BadgeIndianRupee, title: "Compare the offers", text: "Every offer priced the same way, with an itemised breakdown, side by side.", chips: ["Itemised price", "Seller type", "Side-by-side compare"] },
];

export function JourneyPreview() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!auto || reduce) return;
    const t = setInterval(() => setActive((i) => (i + 1) % STEPS.length), 3600);
    return () => clearInterval(t);
  }, [auto, reduce]);

  const step = STEPS[active];
  const pick = (i: number) => {
    setAuto(false);
    setActive(i);
  };

  return (
    <div className="surface rounded-3xl p-5 sm:p-8" onPointerEnter={() => setAuto(false)}>
      <div className="relative h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-ember-deep to-ember"
          animate={{ width: `${((active + 1) / STEPS.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 70, damping: 18 }}
        />
      </div>

      <div role="tablist" aria-label="The seven steps" className="no-scrollbar -mx-5 mt-4 flex gap-1.5 overflow-x-auto px-5 sm:mx-0 sm:justify-between sm:px-0">
        {STEPS.map((s, i) => (
          <button
            key={s.label}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls="journey-panel"
            onClick={() => pick(i)}
            className={`flex min-h-11 flex-none items-center gap-2 rounded-full px-3.5 text-sm transition-colors ${i === active ? "bg-ember text-void" : i < active ? "text-bright hover:bg-white/5" : "text-ash hover:bg-white/5 hover:text-bright"}`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${i === active ? "bg-void/20" : "bg-white/[0.07]"}`}>{i + 1}</span>
            <span className="font-medium">{s.label}</span>
          </button>
        ))}
      </div>

      <div id="journey-panel" role="tabpanel" aria-live="polite" className="mt-6 min-h-[230px] sm:min-h-[180px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={active} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }} className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ember-soft text-ember">
              <step.Icon size={26} aria-hidden />
            </span>
            <div>
              <p className="eyebrow text-ash">
                Step {active + 1} of {STEPS.length}
              </p>
              <h3 className="display mt-2 text-2xl font-bold sm:text-3xl">{step.title}</h3>
              <p className="mt-2 max-w-xl text-fog">{step.text}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {step.chips.map((c) => (
                  <li key={c} className="rounded-full bg-white/[0.06] px-3 py-1.5 text-sm ring-1 ring-hairline">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
