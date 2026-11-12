import type { CategoryId } from "./categories";
import { slug } from "@/lib/slug";

/**
 * STARTER CATALOGUE — NOT VERIFIED.
 * Brand, model and variant names were entered by hand to make the journey
 * work. Line-ups change often. Verify every entry against the manufacturer
 * before launch, or replace this file with a maintained data source.
 * No prices live here on purpose.
 */

export type VehicleForm = "car" | "bike" | "scooter" | "truck";

export type Model = { id: string; name: string; variants: string[]; form?: VehicleForm };
export type Brand = { id: string; name: string; models: Model[] };

const m = (name: string, variants: string[] = ["Standard"], form?: VehicleForm): Model => ({
  id: slug(name),
  name,
  variants,
  form,
});
const b = (name: string, models: Model[]): Brand => ({ id: slug(name), name, models });

export const CATALOG: Record<CategoryId, Brand[]> = {
  cars: [
    b("Maruti Suzuki", [
      m("Swift", ["LXi", "VXi", "ZXi", "ZXi+"]),
      m("Baleno", ["Sigma", "Delta", "Zeta", "Alpha"]),
      m("Brezza", ["LXi", "VXi", "ZXi", "ZXi+"]),
      m("Ertiga", ["LXi", "VXi", "ZXi", "ZXi+"]),
    ]),
    b("Hyundai", [
      m("Creta", ["E", "EX", "S", "SX", "SX (O)"]),
      m("Venue", ["E", "S", "SX"]),
      m("i20", ["Magna", "Sportz", "Asta"]),
      m("Exter", ["EX", "S", "SX"]),
    ]),
    b("Tata", [
      m("Nexon", ["Smart", "Pure", "Creative", "Fearless"]),
      m("Punch", ["Pure", "Adventure", "Accomplished", "Creative"]),
      m("Harrier", ["Smart", "Pure", "Adventure", "Fearless"]),
      m("Altroz"),
    ]),
    b("Mahindra", [
      m("Scorpio-N", ["Z2", "Z4", "Z6", "Z8", "Z8 L"]),
      m("XUV700", ["MX", "AX3", "AX5", "AX7"]),
      m("Thar", ["AX (O)", "LX"]),
      m("Bolero", ["B4", "B6", "B6 (O)"]),
    ]),
    b("Toyota", [
      m("Innova Hycross", ["GX", "VX", "ZX"]),
      m("Fortuner", ["4x2", "4x4"]),
      m("Glanza", ["E", "S", "G", "V"]),
      m("Urban Cruiser Hyryder", ["E", "S", "G", "V"]),
    ]),
    b("Honda", [
      m("City", ["SV", "V", "VX", "ZX"]),
      m("Amaze", ["V", "VX", "ZX"]),
      m("Elevate", ["SV", "V", "VX", "ZX"]),
    ]),
    b("Kia", [
      m("Seltos", ["HTE", "HTK", "HTX", "GTX+"]),
      m("Sonet", ["HTE", "HTK", "HTX", "GTX+"]),
      m("Carens"),
    ]),
    b("BMW", [m("3 Series"), m("5 Series"), m("X1")]),
    b("Mercedes-Benz", [m("C-Class"), m("E-Class"), m("GLA")]),
  ],
  bikes: [
    b("Hero", [m("Splendor Plus"), m("HF Deluxe"), m("Xtreme 160R")]),
    b("Honda", [m("Shine 125"), m("SP 125"), m("Unicorn"), m("H'ness CB350")]),
    b("TVS", [m("Apache RTR 160"), m("Raider 125"), m("Ronin")]),
    b("Bajaj", [m("Pulsar 150"), m("Pulsar NS200"), m("Platina 110"), m("Dominar 400")]),
    b("Royal Enfield", [m("Classic 350"), m("Hunter 350"), m("Bullet 350"), m("Himalayan 450")]),
    b("Yamaha", [m("FZ-S"), m("MT-15"), m("R15")]),
    b("KTM", [m("200 Duke"), m("390 Duke"), m("390 Adventure")]),
  ],
  scooters: [
    b("Honda", [m("Activa"), m("Activa 125"), m("Dio")]),
    b("TVS", [m("Jupiter"), m("Ntorq 125")]),
    b("Suzuki", [m("Access 125"), m("Burgman Street")]),
    b("Hero", [m("Pleasure+"), m("Destini 125")]),
    b("Yamaha", [m("Fascino 125"), m("RayZR 125")]),
  ],
  ev: [
    b("Tata", [m("Nexon EV", undefined, "car"), m("Punch EV", undefined, "car"), m("Tiago EV", undefined, "car")]),
    b("MG", [m("Windsor EV", undefined, "car"), m("ZS EV", undefined, "car"), m("Comet EV", undefined, "car")]),
    b("Mahindra", [m("XUV400", undefined, "car"), m("BE 6", undefined, "car")]),
    b("BYD", [m("Atto 3", undefined, "car"), m("Seal", undefined, "car")]),
    b("Ather", [m("Rizta", ["S", "Z"], "scooter"), m("450X", undefined, "scooter")]),
    b("Ola Electric", [m("S1 Pro", undefined, "scooter"), m("S1 Air", undefined, "scooter"), m("S1 X", undefined, "scooter")]),
    b("TVS", [m("iQube", undefined, "scooter")]),
    b("Bajaj", [m("Chetak", undefined, "scooter")]),
  ],
  commercial: [
    b("Tata Motors", [m("Ace"), m("Intra"), m("Yodha"), m("Ultra")]),
    b("Mahindra", [m("Bolero Pik-Up"), m("Jeeto"), m("Supro")]),
    b("Ashok Leyland", [m("Dost"), m("Bada Dost"), m("Partner")]),
    b("Eicher", [m("Pro 2049"), m("Pro 3015")]),
    b("Maruti Suzuki", [m("Super Carry")]),
  ],
};

export function getBrand(category: CategoryId, brandId: string): Brand | undefined {
  return CATALOG[category].find((x) => x.id === brandId);
}

export function getModel(category: CategoryId, brandId: string, modelId: string): Model | undefined {
  return getBrand(category, brandId)?.models.find((x) => x.id === modelId);
}
