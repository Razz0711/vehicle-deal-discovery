import type { PhotoKind } from "./vehiclePhotos";

/**
 * LICENSED PHOTOGRAPHS FROM WIKIMEDIA COMMONS
 *
 * Real photographs, loaded from Wikimedia's image servers and credited on
 * /credits as their licences require. A photograph placed in
 * /public/vehicles (see the README there) always takes priority over these.
 *
 * Licence and author were read from each file's Commons page on 12 Nov 2026.
 * Re-check the source page before commercial launch; a file can be renamed
 * or deleted, in which case its slot falls back to the empty lit frame.
 */

export type RemotePhoto = {
  /** File title on Commons, exactly as shown there. */
  title: string;
  /** Storage path on upload.wikimedia.org: <h>/<hh>/<File_name>. */
  path: string;
  /** Width of the original in pixels; thumbnails must be smaller. */
  width: number;
  shows: string;
  alt: string;
  author: string;
  licence: string;
  licenceUrl: string;
  /** CSS object-position used when the photo is cropped to a frame. */
  focus?: string;
  /**
   * Catalogue models this photograph actually depicts, as "<brand-id>/<model-id>".
   * A photo is only ever shown for a model listed here.
   */
  models: string[];
};

export const REMOTE_PHOTOS: Partial<Record<PhotoKind, RemotePhoto>> = {
  car: {
    title: "Suzuki Swift (2024) hybrid DSC 7922.jpg",
    path: "3/30/Suzuki_Swift_(2024)_hybrid_DSC_7922.jpg",
    width: 4090,
    shows: "Suzuki Swift (2024), left front view",
    alt: "A 2024 Suzuki Swift hatchback seen from the front left",
    author: "Alexander-93",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    models: ["maruti-suzuki/swift"],
  },
  bike: {
    title: "Royal Enfield Classic 350 (2017 Model Year).jpg",
    path: "0/0f/Royal_Enfield_Classic_350_(2017_Model_Year).jpg",
    width: 4032,
    shows: "Royal Enfield Classic 350, 2017 model year",
    alt: "A Royal Enfield Classic 350 motorcycle",
    author: "Samihasib",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    models: ["royal-enfield/classic-350"],
  },
  scooter: {
    title: "Honda Activa Scooter at Bakkannapalem.JPG",
    path: "7/79/Honda_Activa_Scooter_at_Bakkannapalem.JPG",
    width: 4000,
    shows: "Honda Activa scooter, Visakhapatnam",
    alt: "A Honda Activa scooter parked in Visakhapatnam",
    author: "Adityamadhav83",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    models: ["honda/activa"],
  },
  ev: {
    title: "2020 Tata Nexon EV (India) front view.png",
    path: "e/ea/2020_Tata_Nexon_EV_(India)_front_view.png",
    width: 1920,
    shows: "Tata Nexon EV (2020), front view",
    alt: "A 2020 Tata Nexon EV electric SUV seen from the front",
    author: "DriveSpark",
    licence: "CC BY 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by/3.0/",
    models: ["tata/nexon-ev"],
  },
  truck: {
    title: "Tata Ace EX2 (21729583101).jpg",
    path: "b/b9/Tata_Ace_EX2_(21729583101).jpg",
    width: 1932,
    shows: "Tata Ace EX2 mini truck",
    alt: "A Tata Ace mini truck",
    author: "Everyone Sinks Starco",
    licence: "CC BY-SA 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    models: ["tata-motors/ace"],
  },
  // "ev-scooter": no suitably licensed photograph found yet.
};

/**
 * Photographs of individual models that do not also stand for a vehicle type.
 * To add one: confirm the licence on the file's Commons page, then add an
 * entry here. Nothing else needs to change; /credits lists it automatically.
 */
export const REMOTE_MODEL_PHOTOS: RemotePhoto[] = [
  {
    title: "BMW G20 (2022) IMG 7316.jpg",
    path: "5/57/BMW_G20_(2022)_IMG_7316.jpg",
    width: 5086,
    shows: "BMW 3 Series (G20, 2022)",
    alt: "A 2022 BMW 3 Series saloon",
    author: "Alexander-93",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    models: ["bmw/3-series"],
  },
  {
    title: "Hyundai Creta SU2id PE Creamy White Pearl (3).jpg",
    path: "a/af/Hyundai_Creta_SU2id_PE_Creamy_White_Pearl_(3).jpg",
    width: 3806,
    shows: "Hyundai Creta (second generation, facelift)",
    alt: "A white Hyundai Creta SUV",
    author: "Damian B Oh",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    models: ["hyundai/creta"],
  },
  {
    title: "2021 Kia Seltos 1.6 EX (SP2i; Chile) front view.jpg",
    path: "b/b5/2021_Kia_Seltos_1.6_EX_(SP2i%3B_Chile)_front_view.jpg",
    width: 3479,
    shows: "Kia Seltos (2021), front view",
    alt: "A 2021 Kia Seltos SUV seen from the front",
    author: "RL GNZLZ",
    licence: "CC BY-SA 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    models: ["kia/seltos"],
  },
];

/** Every third-party photograph in use, for lookup and for /credits. */
export const ALL_REMOTE_PHOTOS: RemotePhoto[] = [...Object.values(REMOTE_PHOTOS), ...REMOTE_MODEL_PHOTOS];

/** Thumbnail widths Wikimedia serves. Other widths can be refused. */
const THUMB_STEPS = [500, 960, 1280, 1920];

/** URL of a thumbnail at least `want` pixels wide, never above the original. */
export function commonsThumb(photo: RemotePhoto, want: number): string {
  const allowed = THUMB_STEPS.filter((s) => s < photo.width);
  const width = allowed.find((s) => s >= want) ?? allowed[allowed.length - 1];
  const name = photo.path.split("/").pop();
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${photo.path}/${width}px-${name}`;
}

export function commonsPage(photo: RemotePhoto): string {
  return "https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(photo.title.replace(/ /g, "_"));
}
