"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check, Search, SearchX, X } from "lucide-react";

export type PickerItem = {
  id: string;
  label: string;
  sub?: string;
  group?: string;
  /** Short monogram shown in a tile (brands). */
  mark?: string;
  href: string;
  selected: boolean;
};

/**
 * Searchable grid of options. Each option is a link carrying the whole
 * selection in its URL, so choosing one records the answer and moves on.
 */
export function SearchPicker({
  items,
  searchLabel,
  placeholder,
  noun,
  columns = 3,
}: {
  items: PickerItem[];
  searchLabel: string;
  placeholder: string;
  noun: string;
  columns?: 2 | 3 | 4;
}) {
  const [query, setQuery] = useState("");
  const reduce = useReducedMotion();
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => (q ? items.filter((i) => (i.label + " " + (i.sub ?? "")).toLowerCase().includes(q)) : items), [items, q]);
  const groups = useMemo(() => {
    const map = new Map<string, PickerItem[]>();
    filtered.forEach((i) => map.set(i.group ?? "", [...(map.get(i.group ?? "") ?? []), i]));
    return [...map.entries()];
  }, [filtered]);
  const grid = columns === 4 ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3";
  let n = 0;

  return (
    <div>
      <div className="rise relative max-w-xl" style={{ animationDelay: "160ms" }}>
        <label htmlFor="picker-search" className="sr-only">{searchLabel}</label>
        <Search size={20} aria-hidden className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-ash" />
        <input
          id="picker-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="surface h-14 w-full rounded-full pl-14 pr-14 text-[17px] text-bright outline-none transition-shadow focus:shadow-[0_0_0_1.5px_var(--color-ember),0_0_0_6px_rgb(242_118_50/0.12)]"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-ash hover:bg-white/5 hover:text-bright">
            <X size={18} aria-hidden />
          </button>
        )}
      </div>
      <p className="mt-4 text-sm text-ash" aria-live="polite">
        {filtered.length === items.length ? `${items.length} ${noun}` : `${filtered.length} of ${items.length} ${noun}`}
      </p>

      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface mt-8 flex flex-col items-center rounded-3xl px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ember-soft text-ember">
            <SearchX size={24} aria-hidden />
          </span>
          <p className="display mt-5 text-2xl font-bold">Nothing matches “{query}”</p>
          <p className="mt-2 max-w-sm text-fog">Check the spelling, or clear the search to see all {noun}.</p>
          <button type="button" onClick={() => setQuery("")} className="mt-6 min-h-12 rounded-full bg-ember px-6 font-semibold text-void transition hover:bg-[#ff8a4a]">
            Clear search
          </button>
        </motion.div>
      ) : (
        groups.map(([group, list]) => (
          <section key={group} className="mt-8">
            {group && <h2 className="eyebrow mb-4 text-ash">{group}</h2>}
            <ul className={`grid grid-cols-1 gap-3 ${grid}`}>
              {list.map((item) => {
                const delay = reduce ? 0 : Math.min(n++ * 0.025, 0.5);
                return (
                  <motion.li key={item.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}>
                    <Link
                      href={item.href}
                      aria-current={item.selected ? "true" : undefined}
                      className={`group flex h-full min-h-16 items-center gap-4 rounded-2xl px-4 py-3.5 transition-[transform,background-color,box-shadow] duration-300 hover:-translate-y-0.5 ${
                        item.selected ? "surface is-selected" : "surface hover:bg-graphite"
                      }`}
                    >
                      {item.mark && (
                        <span className={`display flex h-11 w-11 flex-none items-center justify-center rounded-xl text-sm font-extrabold ${item.selected ? "bg-ember text-void" : "bg-white/[0.06] text-bright"}`}>
                          {item.mark}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block break-words font-semibold leading-snug">{item.label}</span>
                        {item.sub && <span className="block text-sm text-ash">{item.sub}</span>}
                      </span>
                      {item.selected ? (
                        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-ember text-void">
                          <Check size={15} strokeWidth={3} aria-label="Selected" />
                        </span>
                      ) : (
                        <ArrowUpRight size={18} aria-hidden className="flex-none text-ash opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-ember group-hover:opacity-100" />
                      )}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
