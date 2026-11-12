import { CATEGORIES, getCategory, type CategoryId } from "@/data/categories";
import { CATALOG, getBrand, getModel, type VehicleForm } from "@/data/catalog";
import { getRegion } from "@/data/locations";
import type { PhotoKind } from "@/data/vehiclePhotos";
import { slug } from "./slug";

/**
 * The customer's selections live in the URL query string, so they survive a
 * refresh, the back button and a shared link. Short keys keep URLs readable:
 * v=vehicle category, s=state, c=city, n=condition, b=brand, m=model, t=variant.
 */
export type Selection = {
  category?: CategoryId;
  state?: string;
  city?: string;
  condition?: "new" | "used";
  brand?: string;
  model?: string;
  variant?: string;
};

export type RawParams = Record<string, string | string[] | undefined>;
export type SelectionKey = keyof Selection;

const PARAM: Record<SelectionKey, string> = {
  category: "v",
  state: "s",
  city: "c",
  condition: "n",
  brand: "b",
  model: "m",
  variant: "t",
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Reads and validates the query string. Anything unknown is dropped. */
export function parseSelection(raw: RawParams): Selection {
  const sel: Selection = {};
  const v = one(raw.v);
  if (CATEGORIES.some((c) => c.id === v)) sel.category = v as CategoryId;

  const region = getRegion(one(raw.s) ?? "");
  if (region) {
    sel.state = region.code;
    const c = one(raw.c);
    if (c && region.cities.some((x) => slug(x) === c)) sel.city = c;
  }

  const n = one(raw.n);
  if (n === "new" || n === "used") sel.condition = n;

  if (sel.category) {
    const brand = getBrand(sel.category, one(raw.b) ?? "");
    if (brand) {
      sel.brand = brand.id;
      const model = brand.models.find((x) => x.id === one(raw.m));
      if (model) {
        sel.model = model.id;
        const t = one(raw.t);
        if (t && model.variants.some((x) => slug(x) === t)) sel.variant = t;
      }
    }
  }
  return sel;
}

export function toQuery(sel: Selection): string {
  const q = new URLSearchParams();
  (Object.keys(PARAM) as SelectionKey[]).forEach((k) => {
    const value = sel[k];
    if (value) q.set(PARAM[k], value);
  });
  const s = q.toString();
  return s ? "?" + s : "";
}

export function hrefFor(path: string, sel: Selection): string {
  return path + toQuery(sel);
}

/** Changing an earlier answer clears the answers that depended on it. */
export function change(sel: Selection, key: SelectionKey, value: string): Selection {
  const next: Selection = { ...sel, [key]: value };
  if (sel[key] === value) return next;
  if (key === "category") {
    delete next.brand;
    delete next.model;
    delete next.variant;
  }
  if (key === "state") delete next.city;
  if (key === "brand") {
    delete next.model;
    delete next.variant;
  }
  if (key === "model") delete next.variant;
  return next;
}

export type Step = { path: string; label: string; done: (sel: Selection) => boolean };

export const STEPS: Step[] = [
  { path: "/explore", label: "Vehicle", done: (s) => !!s.category },
  { path: "/state", label: "State", done: (s) => !!s.state },
  { path: "/city", label: "City", done: (s) => !!s.city },
  { path: "/condition", label: "Condition", done: (s) => !!s.condition },
  { path: "/brand", label: "Brand", done: (s) => !!s.brand },
  { path: "/model", label: "Model", done: (s) => !!s.model && !!s.variant },
  { path: "/deals", label: "Deals", done: () => true },
];

/** Index of the first step the customer has not completed yet. */
export function firstIncomplete(sel: Selection): number {
  const i = STEPS.findIndex((s) => !s.done(sel));
  return i === -1 ? STEPS.length - 1 : i;
}

export type Summary = {
  category?: string;
  state?: string;
  city?: string;
  condition?: string;
  brand?: string;
  model?: string;
  variant?: string;
};

/** Human-readable names for the current selection. */
export function describe(sel: Selection): Summary {
  const out: Summary = {};
  if (sel.category) out.category = getCategory(sel.category).label;
  const region = sel.state ? getRegion(sel.state) : undefined;
  if (region) {
    out.state = region.name;
    out.city = region.cities.find((c) => slug(c) === sel.city);
  }
  if (sel.condition) out.condition = sel.condition === "new" ? "New" : "Used";
  if (sel.category && sel.brand) {
    const brand = getBrand(sel.category, sel.brand);
    out.brand = brand?.name;
    const model = brand?.models.find((x) => x.id === sel.model);
    out.model = model?.name;
    out.variant = model?.variants.find((x) => slug(x) === sel.variant);
  }
  return out;
}

/** Which photograph slot to show for the current selection. */
export function vehicleKind(sel: Selection): PhotoKind {
  switch (sel.category) {
    case "bikes":
      return "bike";
    case "scooters":
      return "scooter";
    case "commercial":
      return "truck";
    case "ev": {
      const form = sel.brand && sel.model ? getModel("ev", sel.brand, sel.model)?.form : undefined;
      return form === "scooter" ? "ev-scooter" : "ev";
    }
    default:
      return "car";
  }
}

export function vehicleForm(sel: Selection): VehicleForm {
  if (sel.category === "bikes") return "bike";
  if (sel.category === "scooters") return "scooter";
  if (sel.category === "commercial") return "truck";
  if (sel.category === "ev" && sel.brand && sel.model) {
    return getModel("ev", sel.brand, sel.model)?.form ?? "car";
  }
  return "car";
}

/** Key for an optional model-specific photograph. */
export function modelKey(sel: Selection): string | undefined {
  return sel.brand && sel.model ? sel.brand + "/" + sel.model : undefined;
}

export const BRAND_COUNT = (category: CategoryId) => CATALOG[category].length;
