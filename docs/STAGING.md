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

## One-time dashboard setup for staging (founder)

The automation available to Claude cannot change Auth settings, so these are applied by hand in the staging project only. Each line matches `supabase/config.toml` or the approved architecture.

1. **Authentication › Sign In / Providers**
   - Phone: **enabled**. Confirm phone: **on**.
   - Email: disabled for now (staff email sign-in comes later).
   - Anonymous sign-ins: **off**.
   - Allow new users to sign up: on.
2. **Phone test numbers** (Phone provider settings, "Test phone numbers and OTPs"). Numbers without the `+`:
   - `919000000001` → a 6-digit code of your choice
   - `919000000002` → a 6-digit code of your choice
   Share the codes privately with the team. Do not commit them. Until an SMS provider (Twilio/MSG91) is connected, only these numbers can sign in.
3. **CAPTCHA** (Authentication › Attack Protection): enable, provider **Cloudflare Turnstile**.
   - In Cloudflare, create a Turnstile widget with hostnames `localhost` and your Vercel preview domain.
   - Paste the **secret** into Supabase. Put the **site key** in `.env.local` and Vercel Preview as `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
4. **Rate limits** (Authentication › Rate Limits): SMS sent per hour **30**; token verifications **30** per 5 minutes per IP; sign-ups/sign-ins **30** per 5 minutes per IP. The stricter product limits (5 codes per number per day, 20 per IP per hour) are enforced by the app in Phase 3.
5. **Sessions:** refresh token rotation **on**, reuse interval 10 s.
6. **Multi-factor:** TOTP (authenticator app) **enabled**. Required for staff (`aal2`).
7. **URL configuration:** Site URL `http://localhost:3000`. Redirect URLs: `http://localhost:3000/**` and `https://*-<your-vercel-team>.vercel.app/**`.
8. **Data API** (Project Settings › Data API): exposed schemas **`public` only**. "Automatically expose new tables" **off** (if shown).
9. **Database password:** saved in your password manager. Never in the repository.

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

The local stack uses the fixed test numbers in `config.toml` (`[auth.sms.test_otp]`), with CAPTCHA off.

## Checks

```bash
npm test               # unit tests (Node test runner)
npm run typecheck
npm run lint
npm run check:secrets  # Git-tracked and staged files, plus .next/static if built
npm run build          # also re-scans the browser bundle afterwards
```

## Known limitations

- The cloud workspace Claude works in cannot pull Docker images, so `supabase start` and `supabase test db` (pgTAP) cannot run there. They run on developer machines. From Phase 4, database tests will run against staging until CI is set up.
