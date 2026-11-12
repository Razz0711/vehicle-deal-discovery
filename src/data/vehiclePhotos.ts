import generated from "./photos.generated.json";

/**
 * VEHICLE PHOTOGRAPHS
 *
 * Every vehicle on screen is a photograph from /public/vehicles. There are no
 * illustrations, renders or generated vehicle images in the codebase.
 *
 * To add one, drop a licensed photograph into /public/vehicles with the file
 * name below (or models/<brand-id>/<model-id>.jpg) and restart the dev
 * server; `scripts/scan-photos.mjs` registers it. Put alt text and any
 * required credit in /public/vehicles/credits.json.
 *
 * Until a photograph exists, its slot shows a neutral lit frame, never an
 * artificial vehicle.
 */

export type PhotoKind = "car" | "bike" | "scooter" | "ev" | "ev-scooter" | "truck";

export type VehiclePhoto = {
  src: string;
  alt: string;
  credit?: string;
  /** CSS object-position, to keep the vehicle in frame when cropped. */
  focus?: string;
};

export const PHOTO_SLOTS: Record<PhotoKind, { file: string; shows: string }> = {
  car: { file: "car.jpg", shows: "a production car" },
  bike: { file: "bike.jpg", shows: "a motorcycle" },
  scooter: { file: "scooter.jpg", shows: "a petrol scooter" },
  ev: { file: "ev.jpg", shows: "an electric car" },
  "ev-scooter": { file: "ev-scooter.jpg", shows: "an electric scooter" },
  truck: { file: "truck.jpg", shows: "a commercial vehicle" },
};

const KINDS = generated.kinds as Partial<Record<PhotoKind, VehiclePhoto>>;
const MODELS = generated.models as Record<string, VehiclePhoto>;

export function findPhoto(kind: PhotoKind, modelKey?: string): { photo?: VehiclePhoto; exact: boolean } {
  const exact = modelKey ? MODELS[modelKey] : undefined;
  if (exact) return { photo: exact, exact: true };
  return { photo: KINDS[kind], exact: false };
}
