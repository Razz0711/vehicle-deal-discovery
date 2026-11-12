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
| Vehicle photographs | **None included.** Slots show an empty lit frame until you add licensed photos |
| Enquiry form | Demo mode: validates, then says nothing was saved or sent |

## Adding vehicle photographs

Drop licensed photographs into `public/vehicles/` using the file names in
`public/vehicles/README.md` (`car.jpg`, `bike.jpg`, `scooter.jpg`, `ev.jpg`,
`ev-scooter.jpg`, `truck.jpg`). They are registered automatically on the next
`npm run dev` or `npm run build`. Model-specific photos go in
`public/vehicles/models/<brand-id>/<model-id>.jpg`. There are no vehicle
illustrations, renders or generated images in the codebase.

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
  components/
    chrome/              Backdrop (animated background), TopBar (logo, progress)
    StepShell.tsx        title block, summary, back/continue bar
    SearchPicker.tsx     searchable option grid with empty state
    steps/               CategoryPicker, ModelPicker, DealsView
    vehicles/            VehiclePhoto (only component that shows a vehicle), VehicleStage
  data/                  categories, catalog, locations, sampleDeals, vehiclePhotos
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

## Connecting real offers

Replace the `sampleDeals()` call in `src/app/deals/page.tsx` with a data fetch
that returns the same `Deal` shape. Set `basis` to `"verified"` only for prices
backed by checked evidence, and remove the sample banner and "Sample" chips in
`components/steps/DealsView.tsx`.
