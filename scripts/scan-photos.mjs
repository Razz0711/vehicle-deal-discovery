#!/usr/bin/env node
/**
 * Builds src/data/photos.generated.json from the photographs present in
 * public/vehicles. Runs automatically before `npm run dev` and `npm run build`.
 *
 *   public/vehicles/car.jpg                      -> type photo for "car"
 *   public/vehicles/models/hyundai/creta.jpg     -> photo for one model
 *   public/vehicles/credits.json (optional)      -> alt text, credit, crop focus
 *
 * credits.json: { "car.jpg": { "alt": "...", "credit": "...", "licence": "...", "focus": "50% 60%" } }
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, extname, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "public", "vehicles");
const OUT = join(ROOT, "src", "data", "photos.generated.json");
const EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const KINDS = {
  car: "a car",
  bike: "a motorcycle",
  scooter: "a scooter",
  ev: "an electric car",
  "ev-scooter": "an electric scooter",
  truck: "a commercial vehicle",
};

const credits = (() => {
  const file = join(DIR, "credits.json");
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    console.warn("[photos] credits.json is not valid JSON:", err.message);
    return {};
  }
})();

function entry(relPath, fallbackAlt) {
  const meta = credits[relPath] ?? {};
  const out = { src: "/vehicles/" + relPath, alt: meta.alt ?? fallbackAlt };
  if (meta.credit) out.credit = meta.credit;
  if (meta.focus) out.focus = meta.focus;
  return out;
}

const kinds = {};
const models = {};

if (existsSync(DIR)) {
  for (const file of readdirSync(DIR)) {
    const ext = extname(file).toLowerCase();
    const kind = basename(file, extname(file));
    if (EXT.has(ext) && KINDS[kind] && !kinds[kind]) kinds[kind] = entry(file, "Photograph of " + KINDS[kind]);
  }
  const modelDir = join(DIR, "models");
  if (existsSync(modelDir)) {
    for (const brand of readdirSync(modelDir)) {
      const brandDir = join(modelDir, brand);
      if (!statSync(brandDir).isDirectory()) continue;
      for (const file of readdirSync(brandDir)) {
        const ext = extname(file).toLowerCase();
        if (!EXT.has(ext)) continue;
        const model = basename(file, extname(file));
        models[brand + "/" + model] = entry(`models/${brand}/${file}`, `Photograph of the ${model.replace(/-/g, " ")}`);
      }
    }
  }
}

writeFileSync(OUT, JSON.stringify({ kinds, models }, null, 2) + "\n");
const n = Object.keys(kinds).length;
console.log(`[photos] ${n} of ${Object.keys(KINDS).length} vehicle-type photos, ${Object.keys(models).length} model photos`);
