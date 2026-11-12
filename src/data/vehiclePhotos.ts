import generated from "./photos.generated.json";
import { ALL_REMOTE_PHOTOS, REMOTE_PHOTOS, commonsThumb, type RemotePhoto } from "./remotePhotos";

/**
 * VEHICLE PHOTO LIBRARY — the single place that decides which photograph,
 * if any, may be shown.
 *
 * Two questions, two functions, and no fallback between them:
 *
 *   typePhoto(kind)       "what does this kind of vehicle look like?"
 *                         Used only where the customer is choosing a vehicle
 *                         type (step 1).
 *
 *   modelPhoto(modelKey)  "what does this exact model look like?"
 *                         Used on the model step and on deal listings. Returns
 *                         a photograph only if it depicts that model. It never
 *                         falls back to a type photo, so a hatchback can never
 *                         appear beside a different car.
 *
 * Sources, in priority order: your own files in /public/vehicles (registered
 * by scripts/scan-photos.mjs), then licensed Wikimedia Commons photographs
 * (data/remotePhotos.ts). All are real photographs; there are no
 * illustrations, renders or generated images.
 */

export type PhotoKind = "car" | "bike" | "scooter" | "ev" | "ev-scooter" | "truck";

export type VehiclePhoto = {
  src: string;
  alt: string;
  credit?: string;
  /** CSS object-position, to keep the vehicle in frame when cropped. */
  focus?: string;
  /** Set when the photograph is loaded from Wikimedia Commons. */
  remote?: RemotePhoto;
};

export const PHOTO_SLOTS: Record<PhotoKind, { file: string; shows: string }> = {
  car: { file: "car.jpg", shows: "a production car" },
  bike: { file: "bike.jpg", shows: "a motorcycle" },
  scooter: { file: "scooter.jpg", shows: "a petrol scooter" },
  ev: { file: "ev.jpg", shows: "an electric car" },
  "ev-scooter": { file: "ev-scooter.jpg", shows: "an electric scooter" },
  truck: { file: "truck.jpg", shows: "a commercial vehicle" },
};

const LOCAL_TYPES = generated.kinds as Partial<Record<PhotoKind, VehiclePhoto>>;
const LOCAL_MODELS = generated.models as Record<string, VehiclePhoto>;

function fromRemote(remote: RemotePhoto): VehiclePhoto {
  return { src: commonsThumb(remote, 1280), alt: remote.alt, credit: remote.author, focus: remote.focus ?? "50% 58%", remote };
}

/** A photograph representing a vehicle type. Step 1 only. */
export function typePhoto(kind: PhotoKind): VehiclePhoto | undefined {
  if (LOCAL_TYPES[kind]) return LOCAL_TYPES[kind];
  const remote = REMOTE_PHOTOS[kind];
  return remote ? fromRemote(remote) : undefined;
}

/** A photograph of exactly this model ("<brand-id>/<model-id>"), or nothing. */
export function modelPhoto(modelKey: string | undefined): VehiclePhoto | undefined {
  if (!modelKey) return undefined;
  if (LOCAL_MODELS[modelKey]) return LOCAL_MODELS[modelKey];
  const remote = ALL_REMOTE_PHOTOS.find((p) => p.models.includes(modelKey));
  return remote ? fromRemote(remote) : undefined;
}
