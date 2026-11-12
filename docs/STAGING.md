# Staging environment

DealFinder has three environments. Everything up to roadmap Phase 12 happens on **staging**.

| Environment | Supabase project | Region | Who uses it |
|---|---|---|---|
| local | `supabase start` (Docker) on a developer machine | n/a | developers |
| **staging** | `dealfinder-staging`, ref `rvcffforsepgrezvaxpm` | ap-south-1 (Mumbai) | development, Vercel Preview |
| production | not created yet | ap-south-1 | Vercel Production (Phase 12) |

The staging ref is not a secret (it is in the public URL). Keys are never written in this file.

## Rules

- Staging and production never share a project, keys, test numbers or data.
- Nothing in this repository may point at production until Phase 12 is approved.
- Schema changes reach staging only as migrations in `supabase/migrations/`, applied with the CLI. No edits in the dashboard SQL editor or table editor.
- The Next.js app uses only the **publishable** key. The **secret** key (`sb_secret_…`) and legacy `service_role` key exist only as Supabase Edge Function secrets. `src/lib/env.ts` refuses to start if one is supplied as the publishable key, and `npm run check:secrets` fails if one appears in Git or in the browser bundle.
- Test phone numbers are fictional (`+91 90000 0000x`). Production must have none.

## Environment variables

| Variable | Public? | local | staging | production |
|---|---|---|---|---|
| `NEXT_PUBLIC_APP_ENV` | yes | `local` | `staging` | `production` |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | `http://127.0.0.1:54321` | `https://rvcffforsepgrezvaxpm.supabase.co` | (Phase 12) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | from `supabase status` | dashboard › API Keys | (Phase 12) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | yes | optional | required | required |

Where values live:

- **Your machine:** `.env.local` (git-ignored). Start from `cp .env.example .env.local`.
- **Vercel:** add staging values to the **Preview** environment only. Leave **Production** empty until Phase 12, so a production deploy can never talk to staging.
- **Supabase dashboard:** the Turnstile *secret* and any SMS provider credentials. They never enter this repository or Vercel.

Note: with `NEXT_PUBLIC_APP_ENV=staging`, the app requires a Turnstile site key. Until step 3 below is done, auth code will report a clear configuration error rather than run without CAPTCHA.

## Google sign-in setup for staging (founder) — current sign-in method (D3-13)

Phone sign-in is paused, so steps 2, 3 and 4a below can wait. Do these instead:

1. **Google Cloud Console** (console.cloud.google.com), using a project you own:
   - **APIs & Services › OAuth consent screen:** User type **External**; app name "DealFinder (staging)"; your support email. Scopes: `openid`, `email`, `profile` only. While the app is in **Testing**, add your own Google accounts under **Test users** (only they can sign in).
   - **APIs & Services › Credentials › Create credentials › OAuth client ID:** type **Web application**.
     - Authorised JavaScript origins: `http://localhost:3000` (and your Vercel preview domain later).
     - Authorised redirect URI: `https://rvcffforsepgrezvaxpm.supabase.co/auth/v1/callback`. This is Supabase's address, not the app's.
   - Copy the **Client ID** and **Client secret**.
2. **Supabase (staging) › Authentication › Sign In / Providers › Google:** enable, then paste the Client ID and Client secret yourself, and save. The secret never goes in this repository or in Vercel.
3. **Supabase › Authentication › URL Configuration:**
   - Site URL: `http://localhost:3000`.
   - Redirect URLs: `http://localhost:3000/auth/callback` (and `https://*-<your-vercel-team>.vercel.app/auth/callback` for previews).
4. **CAPTCHA:** Google sign-in does not use it. If CAPTCHA stays switched on, it must hold the correct Turnstile **secret** key (the one beginning `0x4AAAAAAF-qqO…`); otherwise turn it off until phone sign-in returns.
5. `.env.local`: `SITE_URL=http://localhost:3000` (already set).

## One-time dashboard setup for staging (founder)

The automation available to Claude cannot change Auth settings, so these are applied by hand in the staging project only. Each line matches `supabase/config.toml` or the approved architecture.

1. **Authentication › Sign In / Providers**
   - Phone: **enabled**. Confirm phone: **on**.
   - Email: disabled for now (staff email sign-in comes later).
   - Anonymous sign-ins: **off**.
   - Allow new users to sign up: on.
2. **Phone provider and test numbers** (Phone provider settings).
   - Supabase requires an SMS provider to be configured **even for test numbers**. Until a DLT-registered provider is chosen, select Twilio with placeholder values. Nothing is sent to test numbers.
   - "Test phone numbers and OTPs", numbers without the `+`:
     - `919000000001` → a 6-digit code of your choice
     - `919000000002` → a 6-digit code of your choice
   - "Test OTPs valid until": a date no later than the end of Phase 11.
   - Share the codes privately with the team. Do not commit them. Until a real provider is connected, only these numbers can sign in.
3. **CAPTCHA** (Authentication › Attack Protection): enable, provider **Cloudflare Turnstile**.
   - In Cloudflare, create a Turnstile widget with hostnames `localhost` and your Vercel preview domain.
   - Paste the **secret** into Supabase. Put the **site key** in `.env.local` and Vercel Preview as `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
4. **Rate limits** (Authentication › Rate Limits): SMS sent per hour **30**; token verifications **30** per 5 minutes per IP; sign-ups/sign-ins **30** per 5 minutes per IP. The stricter product limits (5 codes per number per day, 20 per IP per hour) are enforced by the app through `private.rate_limits`.
4a. **OTP limiter token** (Phase 3; decision D3-1). Generate one value and store it in three places, never in Git:
   ```bash
   openssl rand -hex 32
   ```
   - Supabase SQL editor (staging), with your value in place of the placeholder:
     `select vault.create_secret('<the value>', 'otp_limiter_token');`
   - Vercel → Project → Settings → Environment Variables → **Preview** only: `OTP_LIMITER_TOKEN` = the value. Not exposed to the browser: no `NEXT_PUBLIC_` prefix.
   - Your `.env.local`: `OTP_LIMITER_TOKEN=<the value>`.
   Until this is done, code requests show "temporarily unavailable" (fail closed). To rotate: `select vault.update_secret((select id from vault.secrets where name = 'otp_limiter_token'), '<new value>');`, then update Vercel.
5. **Sessions:** refresh token rotation **on**, reuse interval 10 s.
6. **Multi-factor:** TOTP (authenticator app) **enabled**. Required for staff (`aal2`).
7. **URL configuration:** Site URL `http://localhost:3000`. Redirect URLs: `http://localhost:3000/**` and `https://*-<your-vercel-team>.vercel.app/**`.
8. **Data API** (Project Settings › Data API): exposed schemas **`public` only**. "Automatically expose new tables" **off** (if shown).
9. **Database password:** saved in your password manager. Never in the repository.

## Database (Phase 3)

Applied to staging (`supabase/migrations/`):

| Version | Name | Contents |
|---|---|---|
| 20261112192327 | baseline_privileges | default-privilege revokes, `private` schema |
| 20261112192332 | identity_consent | `profiles`, `legal_documents`, `consent_events` |
| 20261112192335 | rate_limits | `private.rate_limits`, limiter functions |
| 20261112192339 | auth_functions | `is_registered_buyer()`, `complete_onboarding()` |

- Staging data: `legal_documents` has version `2026-11-13-preview-draft` of the privacy notice and terms (`supabase/seed.sql`; `npm run legal:hashes`).
- A change to `src/app/privacy/page.tsx` or `src/app/terms/page.tsx` needs a new version row.
- Users with consent history cannot be deleted (decision D3-5). Reuse the two test numbers.

## CLI

The Supabase CLI is a dev dependency (`npm run supabase -- <command>`).

Link to staging (founder, once per machine, with a personal access token from supabase.com › Account › Access Tokens):

```bash
export SUPABASE_ACCESS_TOKEN=...   # in your shell only; never in a file in this repo
npm run supabase -- link --project-ref rvcffforsepgrezvaxpm
```

`supabase link` writes to `supabase/.temp/`, which is git-ignored. Never run `supabase link` against a production ref from this branch.

Local stack (needs Docker):

```bash
npm run supabase -- start      # Postgres, Auth, Studio on 127.0.0.1
npm run supabase -- status     # prints local URL and publishable key
```

For local phone sign-in, export `SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN=local-placeholder` before `supabase start`. The local Twilio entry is a placeholder; local test numbers never send SMS. Then create the local limiter token: `select vault.create_secret('<64 hex>', 'otp_limiter_token');`, and set the same value in `.env.local`.

The local stack uses the fixed test numbers in `config.toml` (`[auth.sms.test_otp]`), with CAPTCHA off.

## Checks

```bash
npm test               # unit tests (Node test runner)
npm run test:db -- postgres://postgres@127.0.0.1:54322/postgres   # migrations + 81 security cases on a fresh local database
npm run test:db:concurrency -- <same url>                          # limiter under real parallel connections
npm run test:http -- http://localhost:3000                         # protected routes, redirects, forged cookies (against npm start)
npm run test:e2e:staging:phone                                     # live phone sign-in on staging (paused with phone, D3-13)
npm run typecheck
npm run lint
npm run check:secrets  # Git-tracked and staged files, plus .next/static if built
npm run build          # also re-scans the browser bundle afterwards
```

## Known limitations

- The cloud workspace Claude works in cannot pull Docker images, so `supabase start` and `supabase test db` (pgTAP) cannot run there. They run on developer machines. From Phase 4, database tests will run against staging until CI is set up.
