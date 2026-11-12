/**
 * VEHICLE PHOTOGRAPH MANIFEST
 *
 * Every vehicle shown anywhere in the application comes from this file.
 * There are no illustrations, renders or generated images in the codebase.
 * A slot with no entry shows a neutral "photograph to be added" frame, never
 * an artificial vehicle.
 *
 * To add a photograph:
 *   1. Use a real photograph you are licensed to use (your own, a paid stock
 *      licence, manufacturer press material you have permission for, or a
 *      Creative Commons image whose terms you follow).
 *   2. Save it in /public/vehicles/ (landscape, 3:2 or wider, at least
 *      1600 px wide, subject roughly centred, JPEG or WebP).
 *   3. Add an entry below with honest alt text, and the credit line if the
 *      licence requires one. Keep a record of the licence in `licence`.
 *
 * Model-specific photographs are optional. Without one, a listing shows the
 * photograph for its vehicle type, labelled as representative.
 */

export type PhotoKind = "car" | "bike" | "scooter" | "ev" | "ev-scooter" | "truck";

export type VehiclePhoto = {
  /** Path under /public, for example "/vehicles/car.jpg". */
  src: string;
  /** What the photograph actually shows. */
  alt: string;
  /** Shown on the image when the licence requires attribution. */
  credit?: string;
  /** For your records: licence name and where the image came from. */
  licence?: string;
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

/** One photograph per vehicle type. Empty until licensed photographs are supplied. */
export const VEHICLE_PHOTOS: Partial<Record<PhotoKind, VehiclePhoto>> = {
  // car: { src: "/vehicles/car.jpg", alt: "…", credit: "…", licence: "…" },
};

/** Optional photographs of specific models, keyed "<brand-id>/<model-id>". */
export const MODEL_PHOTOS: Record<string, VehiclePhoto> = {
  // "hyundai/creta": { src: "/vehicles/models/hyundai-creta.jpg", alt: "…" },
};

export function findPhoto(kind: PhotoKind, modelKey?: string): { photo?: VehiclePhoto; exact: boolean } {
  const exact = modelKey ? MODEL_PHOTOS[modelKey] : undefined;
  if (exact) return { photo: exact, exact: true };
  return { photo: VEHICLE_PHOTOS[kind], exact: false };
}
