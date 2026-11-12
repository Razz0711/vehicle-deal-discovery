import { REMOTE_MODEL_PHOTOS, REMOTE_PHOTOS, REMOTE_SHOWCASE_PHOTOS, type RemotePhoto } from "./remotePhotos";

/**
 * The vehicles that appear as moving atmosphere on the landing page: which
 * photograph, and what kind of vehicle it stands for. Edit this one list to
 * change the cast. Every entry is a licensed photograph credited on /credits.
 */
export type ShowcaseItem = { id: string; name: string; segment: string; photo: RemotePhoto };

const byTitle = (start: string): RemotePhoto => {
  const all = [...Object.values(REMOTE_PHOTOS), ...REMOTE_MODEL_PHOTOS, ...REMOTE_SHOWCASE_PHOTOS];
  const found = all.find((p) => p.title.startsWith(start));
  if (!found) throw new Error("Showcase photo not found: " + start);
  return found;
};

export const SHOWCASE: ShowcaseItem[] = [
  { id: "sedan", name: "BMW 3 Series", segment: "Luxury sedan", photo: byTitle("BMW G20") },
  { id: "supercar", name: "Lamborghini Huracán Evo", segment: "Supercar", photo: byTitle("Lamborghini Huracan") },
  { id: "suv", name: "Range Rover", segment: "Premium SUV", photo: byTitle("Land Rover Range Rover") },
  { id: "sports", name: "Porsche 911 Carrera S", segment: "Sports car", photo: byTitle("Porsche 992") },
  { id: "ev", name: "Mercedes-Benz EQS", segment: "Premium electric", photo: byTitle("Mercedes-Benz EQS") },
  { id: "superbike", name: "Ducati Panigale V4 R", segment: "Superbike", photo: byTitle("Ducati Panigale") },
  { id: "compact-suv", name: "Hyundai Creta", segment: "Compact SUV", photo: byTitle("Hyundai Creta") },
  { id: "cruiser", name: "Royal Enfield Classic 350", segment: "Motorcycle", photo: byTitle("Royal Enfield Classic") },
  { id: "hatch", name: "Suzuki Swift", segment: "Hatchback", photo: byTitle("Suzuki Swift") },
  { id: "scooter", name: "Honda Activa", segment: "Scooter", photo: byTitle("Honda Activa") },
  { id: "ev-suv", name: "Tata Nexon EV", segment: "Electric SUV", photo: byTitle("2020 Tata Nexon EV") },
  { id: "commercial", name: "Tata Ace", segment: "Commercial", photo: byTitle("Tata Ace") },
];

export const showcase = (id: string): ShowcaseItem => SHOWCASE.find((s) => s.id === id)!;
