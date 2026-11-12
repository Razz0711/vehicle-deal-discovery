# Vehicle deal-discovery journey

A seven-step, multi-page flow: vehicle type → state → city → new or used →
brand → model and variant → deals.

Built with Next.js (App Router), TypeScript, Tailwind CSS, Motion and Lucide
icons. There is no backend yet.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run photos   # re-scan public/vehicles after adding photographs
```

## What is real and what is not

| Part | Status |
|---|---|
| Journey, routing, validation, search, compare, enquiry form | Working |
| States and union territories | All 28 states and 8 UTs |
| Cities | Starter list of major cities per region, not complete |
| Brands, models, variants | Starter catalogue entered by hand, **not verified** |
| Deals, sellers, prices, "verified" badges | **Sample data only.** See `src/data/sampleDeals.ts` |
| Vehicle photographs | Five licensed photos loaded from Wikimedia Commons (car, motorcycle, scooter, electric car, mini truck), credited on `/credits`. No electric-scooter photo yet. Your own files in `public/vehicles/` override them |
| Enquiry form | Demo mode: validates, then says nothing was saved or sent |

## Vehicle photographs

Every vehicle shown is a real photograph. There are no illustrations, renders
or generated vehicle images in the codebase. Sources, in priority order:

1. **Your own files.** Drop licensed photographs into `public/vehicles/` using
   the names in `public/vehicles/README.md` (`car.jpg`, `bike.jpg`,
   `scooter.jpg`, `ev.jpg`, `ev-scooter.jpg`, `truck.jpg`), or
   `public/vehicles/models/<brand-id>/<model-id>.jpg` for one model. They are
   registered on the next `npm run dev` or `npm run build`.
2. **Wikimedia Commons.** `src/data/remotePhotos.ts` lists five Creative
   Commons photographs, loaded directly from Wikimedia's servers. Their
   licences require attribution, which is given on the `/credits` page and
   linked from every step. Keep that page if you keep these photos.
3. **Nothing.** If a photo is missing or fails to load, the slot shows an
   empty lit frame instead of a broken image.

Listings show a "Representative photo" chip unless a model-specific file
exists, because the type photo is not the exact model on offer.

## Design system

Defined as tokens in `src/app/globals.css`.

- **Colour:** near-black ground (`void`), graphite surfaces (`coal`,
  `graphite`), white and grey text (`bright`, `fog`, `ash`), one accent
  (`ember`, #F27632) reserved for selection, progress and the primary action.
- **Type:** Manrope for display, Inter for text, both self-hosted.
- **Surfaces:** `.surface` (lit from above, hairline edge), `.glass` (header,
  footer and compare tray only), `.is-selected` (ember ring with bloom).
- **Background:** `components/chrome/Backdrop.tsx`, mounted once in the root
  layout. Two drifting key lights that glide to a new position per step, a
  parallax grid, light streaks and a small particle canvas. Transform-only,
  paused when the tab is hidden, static under reduced motion.
- **Motion:** page entrance (`app/template.tsx`), staggered cards, shared
  layout transition from category card to full screen, animated progress bar,
  photo wipe-and-settle on the side stage, scroll-triggered deal rows.
  `MotionConfig reducedMotion="user"` plus a CSS media query switch it off.

## Where things live

```
scripts/scan-photos.mjs  registers photographs found in public/vehicles
src/
  app/                   one folder per step; each page is a server component
    layout.tsx           fonts, Backdrop, TopBar
    template.tsx         page transition
    loading.tsx          loading state
    not-found.tsx        404 page
    error.tsx            error page
    credits/             photo attribution
  components/
    chrome/              Backdrop (animated background), TopBar (logo, progress)
    StepShell.tsx        title block, summary, back/continue bar
    SearchPicker.tsx     searchable option grid with empty state
    steps/               CategoryPicker, ModelPicker, DealsView
    vehicles/            VehiclePhoto (only component that shows a vehicle), VehicleStage
  data/                  categories, catalog, locations, sampleDeals, vehiclePhotos, remotePhotos
  lib/
    selection.ts         selection state: parse, validate, URLs, steps
    guard.ts             redirects to the first unanswered step
    site.ts              brand name (change it here only)
```

## How selections persist

Every choice is stored in the URL query string (`?v=cars&s=GJ&c=surat…`).
A refresh, the back button or a shared link all restore the same state.
Changing an earlier answer clears only the answers that depended on it.
Opening a later step without the earlier answers redirects to the first
unanswered step.

## Search engines

The site sends `noindex` (see `metadata.robots` in `src/app/layout.tsx`) because
the deals are sample data. Remove it when real offers are connected.

## Connecting real offers

Replace the `sampleDeals()` call in `src/app/deals/page.tsx` with a data fetch
that returns the same `Deal` shape. Set `basis` to `"verified"` only for prices
backed by checked evidence, and remove the sample banner and "Sample" chips in
`components/steps/DealsView.tsx`.
