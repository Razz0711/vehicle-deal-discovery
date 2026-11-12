# Vehicle photographs

Drop real, licensed photographs here. They are picked up automatically the
next time you run `npm run dev` or `npm run build` (or run `npm run photos`).

| File | Must show | Used on |
|---|---|---|
| car.jpg | a production car | Step 1 card, side stage, condition cards, car listings |
| bike.jpg | a motorcycle | same, for bikes |
| scooter.jpg | a petrol scooter | same, for scooters |
| ev.jpg | an electric car | same, for electric cars |
| ev-scooter.jpg | an electric scooter | electric scooter models |
| truck.jpg | a commercial vehicle | same, for commercial vehicles |

Model-specific photographs: `models/<brand-id>/<model-id>.jpg`, for example
`models/hyundai/creta.jpg`. The model step and the deals page then show it. A model
without its own photograph shows none; a type photo is never used in its place.

Specs: landscape, 3:2 or wider, at least 1600 px wide, vehicle roughly
centred with some space around it. JPEG or WebP. Photographs are cropped to
fill each frame, never stretched; use `focus` below if the crop cuts the
vehicle.

Alt text and credits go in `credits.json` next to the photos:

```json
{
  "car.jpg": {
    "alt": "Silver hatchback parked on a city street at dusk",
    "credit": "Photographer name / source",
    "licence": "Licence name and link, for your records",
    "focus": "50% 65%"
  }
}
```

Only use photographs you are licensed to use: your own, a paid stock licence,
manufacturer press images you have permission for, or Creative Commons
images whose attribution terms you follow. No illustrations, renders or
AI-generated images.
