# Architecture notes

Status as of 12 Nov 2026. The app is a front end only: no server, database or
account backend exists yet. This note records the decisions that keep it
ready for a two-sided marketplace (buyers, sellers) with an admin portal,
without building those parts yet.

## One account system, three roles

`src/lib/auth.ts` is the only place the interface talks to authentication.

| Role | Who | Home route | Built |
|---|---|---|---|
| `buyer` | Consumers | `/explore` | Yes (sign-up screens; backend not connected) |
| `seller` | Dealers, agencies, resellers, individual sellers | `/partner` (reserved) | No |
| `admin` | Platform staff | `/admin` (reserved) | No |

Rules:
- Everyone signs in the same way (mobile OTP). The role is stored on the
  account and read after verification. Sign-in screens never ask for it.
- Buyers self-register. Seller accounts need business verification before
  they can publish offers. Admin accounts are created by another admin only.
- One person may later hold more than one role (a dealer who is also a
  buyer). Store roles as a set, not a single column, if that is wanted.
- Reserved routes are not linked anywhere until they exist.

## One vehicle catalogue

`src/data/catalog.ts` (categories → brands → models → variants) is the single
vehicle list. Buyers choose from it; sellers will attach offers to its
variant ids; admins will maintain it. Neither portal gets its own copy.

## Offers and evidence

`src/data/sampleDeals.ts` defines the offer shape. `basis` is one of
`sample`, `estimated`, `seller-submitted`, `verified`. Only `sample` is ever
generated. A real offer belongs to a seller account and a catalogue variant,
in a city, with a price breakdown, a validity date and its evidence.

## Proposed data model (not built; for discussion)

- `accounts` (id, mobile, email, name, created_at)
- `account_roles` (account_id, role, status)
- `buyer_profiles` (account_id, state, city, condition_preference)
- `sellers` (id, legal_name, type, gstin, trade_certificate, verification_status)
- `seller_members` (seller_id, account_id, permission) — staff of a dealership
- `seller_locations` (seller_id, state, city, address)
- `catalog_*` (categories, brands, models, variants) — migrated from catalog.ts
- `offers` (id, seller_id, variant_id, city, condition, price lines, valid_until, basis, evidence_ref, status)
- `enquiries` (id, buyer_account_id, offer_id, consent_at, status)
- `audit_log` (actor_account_id, action, target, at) — every admin action

## Routing

- `/` landing, `/register`, `/signin`, `/about`, `/contact`, `/privacy`,
  `/terms`, `/credits`: public site, with `SiteNav` and `SiteFooter`.
- `/explore` → `/state` → `/city` → `/condition` → `/brand` → `/model` →
  `/deals`: the buyer journey, with `TopBar`. Selections live in the URL.
- `/partner/*` and `/admin/*`: reserved. When built, each gets its own
  layout and a server-side role check; neither reuses the buyer chrome.
