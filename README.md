# Vehicle deal-discovery journey

A seven-step, multi-page flow: vehicle type → state → city → new or used →
brand → model and variant → deals.

Built with Next.js (App Router), TypeScript, Tailwind CSS, Motion and Lucide
icons. There is no backend.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## What is real and what is not

| Part | Status |
|---|---|
| Journey, routing, validation, search, compare, enquiry form | Working |
| States and union territories | All 28 states and 8 UTs |
| Cities | Starter list of major cities per region, not complete |
| Brands, models, variants | Starter catalogue entered by hand, **not verified** |
| Deals, sellers, prices | **Sample data only.** Fictional sellers, placeholder prices. See `src/data/sampleDeals.ts` |
| Vehicle visuals | Real photographs only, registered in `src/data/vehiclePhotos.ts`. **None supplied yet**, so every slot shows a "Photograph to be added" frame. There are no illustrations, renders or generated images in the codebase |
| Enquiry form | Demo mode: validates, then says nothing was saved or sent |

## Where things live

```
src/
  app/                 one folder per step; each page is a server component
    page.tsx           1 vehicle type      /
    state/             2 state             /state
    city/              3 city              /city
    condition/         4 new or used       /condition
    brand/             5 brand             /brand
    model/             6 model + variant   /model
    deals/             7 deals             /deals
    template.tsx       page transition
    loading.tsx        loading skeleton
  components/
    StepShell.tsx      header, progress, summary, back/next
    SearchPicker.tsx   searchable option grid with empty state
    steps/             CategoryPicker, ModelPicker, DealsView
    vehicles/          VehiclePhoto (the only vehicle renderer), VehicleStage (animation)
  data/                categories, catalog, locations, sampleDeals
  lib/
    selection.ts       selection state: parse, validate, URLs, steps
    guard.ts           redirects to the first unanswered step
    site.ts            brand name (change it here only)
```

## How selections persist

Every choice is stored in the URL query string (`?v=cars&s=GJ&c=surat…`).
A refresh, the back button or a shared link all restore the same state.
Changing an earlier answer clears only the answers that depended on it.
Opening a later step without the earlier answers redirects to the first
unanswered step.

## Replacing placeholders

- **Photography:** put licensed photographs in `public/vehicles/` and register them in `src/data/vehiclePhotos.ts`. See `public/vehicles/README.md`.
- **Real offers:** replace the `sampleDeals()` call in `src/app/deals/page.tsx`
  with a data fetch that returns the same `Deal` shape, and set `isSample`
  per listing.
- **Brand name:** `src/lib/site.ts`.
