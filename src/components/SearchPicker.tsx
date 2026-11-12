"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";

export type PickerItem = {
  id: string;
  label: string;
  sub?: string;
  group?: string;
  href: string;
  selected: boolean;
};

/**
 * A searchable grid of options. Each option is a link that carries the whole
 * selection in its URL, so choosing one both records the answer and moves on.
 */
export function SearchPicker({
  items,
  searchLabel,
  placeholder,
  noun,
}: {
  items: PickerItem[];
  searchLabel: string;
  placeholder: string;
  noun: string;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => (q ? items.filter((i) => (i.label + " " + (i.sub ?? "")).toLowerCase().includes(q)) : items), [items, q]);
  const groups = useMemo(() => {
    const map = new Map<string, PickerItem[]>();
    filtered.forEach((i) => {
      const key = i.group ?? "";
      map.set(key, [...(map.get(key) ?? []), i]);
    });
    return [...map.entries()];
  }, [filtered]);

  return (
    <div>
      <div className="relative max-w-md">
        <label htmlFor="picker-search" className="sr-only">
          {searchLabel}
        </label>
        <Search size={18} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
        <input
          id="picker-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="h-12 w-full rounded border border-edge bg-ink pl-11 pr-11 text-white"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-mist hover:text-white">
            <X size={18} aria-hidden />
          </button>
        )}
      </div>
      <p className="mt-3 text-sm text-mist" aria-live="polite">
        {filtered.length} of {items.length} {noun}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-md border border-dashed border-edge p-8 text-center">
          <p className="display text-xl font-bold">Nothing matches “{query}”</p>
          <p className="mt-2 text-soft">Check the spelling, or clear the search to see every option.</p>
          <button type="button" onClick={() => setQuery("")} className="mt-5 min-h-12 rounded bg-blue px-5 font-semibold text-white hover:bg-blue-deep">
            Clear search
          </button>
        </div>
      ) : (
        groups.map(([group, list]) => (
          <section key={group} className="mt-6">
            {group && <h2 className="eyebrow mb-3 text-mist">{group}</h2>}
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    aria-current={item.selected ? "true" : undefined}
                    className={`group flex min-h-14 items-center justify-between gap-3 rounded border px-4 py-3 transition-colors ${
                      item.selected ? "border-paper bg-paper text-ink" : "border-line bg-ink-2 hover:border-sky"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{item.label}</span>
                      {item.sub && <span className={`block text-sm ${item.selected ? "text-slate" : "text-mist"}`}>{item.sub}</span>}
                    </span>
                    {item.selected ? (
                      <Check size={18} aria-label="Selected" className="flex-none text-blue-deep" />
                    ) : (
                      <span aria-hidden className="flex-none translate-x-0 text-mist transition-transform group-hover:translate-x-1 group-hover:text-sky">
                        →
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
