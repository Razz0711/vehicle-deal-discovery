import type { VehicleForm } from "./catalog";

/**
 * SAMPLE DATA GENERATOR — NOT REAL OFFERS.
 * There is no backend yet, so the deals page is filled with placeholder
 * listings so the layout, comparison and enquiry flows can be exercised.
 * Sellers are fictional. Prices are random numbers inside a broad band for
 * the vehicle type; they are NOT the real price of any model.
 * Delete this file when real, verified offers are connected.
 */

export type SellerType =
  | "Authorised dealer"
  | "Multi-brand dealer"
  | "Used-vehicle dealer"
  | "Certified pre-owned"
  | "Individual seller";

export type Deal = {
  id: string;
  seller: string;
  sellerType: SellerType;
  isSample: true;
  /** Ex-showroom for new vehicles, asking price for used ones. */
  price: number;
  priceLabel: string;
  onRoad?: number;
  breakdown: { label: string; amount: number }[];
  availability: string;
  used?: { year: number; km: number; owners: number };
};

const BAND: Record<VehicleForm, [number, number]> = {
  car: [600000, 1800000],
  bike: [90000, 240000],
  scooter: [80000, 150000],
  truck: [500000, 2500000],
};

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n: number, to: number) => Math.round(n / to) * to;

export function sampleDeals(input: {
  key: string;
  form: VehicleForm;
  condition: "new" | "used";
  variantIndex: number;
}): Deal[] {
  const [lo, hi] = BAND[input.form];
  const base = (lo + rng(hash(input.key.split("|").slice(0, 2).join("|")))() * (hi - lo)) * (1 + input.variantIndex * 0.06);
  const rand = rng(hash(input.key + "|" + input.condition));
  const step = input.form === "car" || input.form === "truck" ? 1000 : 100;

  if (input.condition === "new") {
    const sellers: [string, SellerType][] = [
      ["Sample Dealer A", "Authorised dealer"],
      ["Sample Dealer B", "Authorised dealer"],
      ["Sample Dealer C", "Authorised dealer"],
      ["Sample Dealer D", "Multi-brand dealer"],
    ];
    return sellers.map(([seller, sellerType], i) => {
      const ex = round(base, step);
      const rto = round(ex * 0.09, step);
      const insurance = round(ex * (0.035 + rand() * 0.012), step);
      const accessories = round(ex * rand() * 0.012, step);
      const discount = round(ex * rand() * 0.03, step);
      const onRoad = ex + rto + insurance + accessories - discount;
      return {
        id: "new-" + i,
        seller,
        sellerType,
        isSample: true as const,
        price: ex,
        priceLabel: "Ex-showroom",
        onRoad,
        breakdown: [
          { label: "Ex-showroom price", amount: ex },
          { label: "RTO and registration", amount: rto },
          { label: "Insurance", amount: insurance },
          { label: "Accessories", amount: accessories },
          { label: "Seller discount", amount: -discount },
        ],
        availability: rand() > 0.35 ? "In stock" : "On order",
      };
    });
  }

  const sellers: [string, SellerType][] = [
    ["Sample Used-Vehicle Dealer", "Used-vehicle dealer"],
    ["Sample Pre-Owned Outlet", "Certified pre-owned"],
    ["Sample Individual Seller", "Individual seller"],
  ];
  return sellers.map(([seller, sellerType], i) => {
    const year = 2018 + Math.floor(rand() * 7);
    const age = 2026 - year;
    const price = round(base * Math.max(0.35, 0.85 - age * 0.07 - rand() * 0.05), step);
    return {
      id: "used-" + i,
      seller,
      sellerType,
      isSample: true as const,
      price,
      priceLabel: "Asking price",
      breakdown: [{ label: "Asking price", amount: price }],
      availability: "Available",
      used: {
        year,
        km: round(age * (6000 + rand() * 9000) + 3000, 500),
        owners: rand() > 0.7 ? 2 : 1,
      },
    };
  });
}
