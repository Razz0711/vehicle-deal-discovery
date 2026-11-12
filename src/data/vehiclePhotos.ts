import generated from "./photos.generated.json";
import { REMOTE_PHOTOS, commonsThumb, type RemotePhoto } from "./remotePhotos";

/**
 * VEHICLE PHOTOGRAPHS
 *
 * Every vehicle on screen is a real photograph. There are no illustrations,
 * renders or generated vehicle images in the codebase. Sources, in order:
 *
 * 1. Your own files in /public/vehicles (registered by scripts/scan-photos.mjs;
 *    see the README in that folder). Model-specific files win over type files.
 * 2. Licensed photographs from Wikimedia Commons (data/remotePhotos.ts).
 * 3. Nothing: the slot shows an empty lit frame, never an artificial vehicle.
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

const KINDS = generated.kinds as Partial<Record<PhotoKind, VehiclePhoto>>;
const MODELS = generated.models as Record<string, VehiclePhoto>;

export function findPhoto(kind: PhotoKind, modelKey?: string): { photo?: VehiclePhoto; exact: boolean } {
  const exact = modelKey ? MODELS[modelKey] : undefined;
  if (exact) return { photo: exact, exact: true };
  if (KINDS[kind]) return { photo: KINDS[kind], exact: false };
  const remote = REMOTE_PHOTOS[kind];
  if (remote) {
    return {
      photo: { src: commonsThumb(remote, 1280), alt: remote.alt, credit: remote.author, focus: remote.focus ?? "50% 58%", remote },
      exact: false,
    };
  }
  return { photo: undefined, exact: false };
}
