# Phase 3: implementation decisions and deviations

Baseline: the approved round-two architecture (`docs/ARCHITECTURE` proposal, review doc sections 8 to 10).
This file records every place where Phase 3 had to differ, and why. Written before implementation.

## D3-1. OTP rate limiter: a server-only limiter token (deviation)

**Architecture:** "Mobile number + CAPTCHA → server action checks `private.rate_limits` → Supabase phone OTP." Server actions use the publishable key only.

**Problem found:**
- The server action holds only the publishable key, so anything it can call is also callable by anyone on the internet.
- A public `rate limit` RPC callable by `anon` would let an attacker burn a victim's 5-codes-per-day quota from a script. That would lock the victim out of sign-in for a day.
- The attacker could also send fake IP addresses.

**Decision:**
- The limiter RPC requires a 256-bit **limiter token**. It lives in two places:
  - in Supabase Vault (secret name `otp_limiter_token`);
  - in the server-only env var `OTP_LIMITER_TOKEN`, read through a module that imports `server-only`.
- This token is not a Supabase key. It grants nothing except "count one OTP attempt". It is never in browser code, and the secret scan checks that.
- The phone and IP are stored only as HMAC-SHA256 values keyed with the same token, so `private.rate_limits` holds no readable numbers.
- If the token is missing or wrong, the function refuses (fail closed). Sign-in then shows "temporarily unavailable" rather than skipping the limit.

**Known limit, unchanged by this decision:**
- Someone calling Supabase Auth directly with the publishable key skips any app-level check.
- On that path, the protections are:
  - CAPTCHA, verified by Supabase itself;
  - Supabase's own limits: per-number frequency, per-IP verification limits and the project-wide SMS cap.
- The architecture's production plan (the Send SMS hook, roadmap Phase 9/12) closes this gap. Auth calls the hook for every SMS and cannot skip it, and the hook will call the same `private.consume_otp_quota` function.

## D3-2. Onboarding through one guarded function (stricter than the matrix)

**Architecture matrix:** authenticated users get `insert` on `profiles` ("self, once"). Consent events are written separately.

**Decision:**
- Onboarding goes through `private.complete_onboarding()` (security definer, `search_path = ''`, reached through a `security invoker` wrapper in `public`). It does all of the following in one transaction:
  - validates input;
  - creates the profile;
  - writes the `privacy_notice/acknowledged` and `terms/accepted` events against the **current** document versions;
  - sets `onboarded_at`.
- Users get no direct `insert` on `profiles`, so nobody can mark themselves onboarded without the consent records.
- Direct `insert` on `consent_events` remains as the matrix says (for later re-acceptance and marketing choices). It is checked by policy and trigger.

## D3-3. `profiles.city_id` becomes `state_code` + `city_name` until Phase 4

The `cities` table arrives in Phase 4 (catalogue migration), so a foreign key is impossible now.

- Phase 3 stores `state_code` (two letters, checked) and `city_name` (checked length).
- The server validates both against `src/data/locations.ts`.
- Phase 4's migration adds `city_id`, back-fills it from `(state_code, city_name)`, and adds the foreign key.

## D3-4. `consent_events.subject_org_id` without a foreign key until Phase 6

`organizations` arrives in Phase 6.

- The column exists now, but no foreign key yet.
- The insert policy refuses `enquiry_share` events in Phase 3.
- Phase 6 adds the foreign key and opens the policy.

## D3-5. Consent history blocks hard deletion of a user (by design)

- `consent_events` is append-only for every role, enforced by grants **and** triggers on update, delete and truncate.
- Its `user_id` foreign key therefore uses `on delete no action`. Deleting an auth user who has consent history fails until the data-rights process (`data_requests`, Phase 12) decides what proof must be retained.
- This also applies to staging test users.

## D3-6. Migration versions are timestamps

- The architecture's numbered list (0001 to 0014) is a logical order.
- Supabase CLI versions must increase, and Phase 3 needs pieces of 0001, 0003 and 0005 before 0002 and 0004 exist. So files use timestamp versions with these names:
  1. `baseline_privileges`: default-privilege revokes, global function revoke, `private` schema.
  2. `identity_consent`: `profiles`, `legal_documents`, `consent_events`.
  3. `rate_limits`: `private.rate_limits` and the limiter function.
  4. `auth_functions`: `is_registered_buyer()`, `complete_onboarding()`.
- `audit.logs` is Phase 4. Phase 3 functions that the architecture wants audited will gain audit writes then.

## D3-7. One flow for sign-up and sign-in (no account enumeration)

- Both screens send the code with `shouldCreateUser: true`. Neither reveals before verification whether a number is registered.
- After verification:
  - an onboarded user goes to the safe `next` route;
  - anyone else goes to onboarding.
- The register screen keeps its details-first layout. If the number already had an account, the person is simply signed in and told so.
- Supabase returns the same error for wrong and expired codes, so the app shows one message ("wrong or expired").

## D3-8. Seller and admin routes fail closed until their tables exist

- Membership (`organization_members`) and staff grants (`private.staff_role_grants`) arrive in Phase 6.
- `/partner` requires a registered user and shows that the seller portal is not open. No seller data exists.
- `/admin` requires a signed-in user with `aal2` **and** a staff grant. With no grant table, everyone is refused.
- The MFA enrolment screen for staff moves to Phase 6, next to the staff bootstrap it serves.

## D3-9. Adult declaration added to the sign-up form

The architecture requires `is_adult_declared`, and the existing form lacked it. A required checkbox ("I am 18 or older") is added. The database refuses onboarding without it.

## D3-10. Testing environment

- This workspace cannot reach `*.supabase.co` from the shell, and cannot download Docker images or Supabase release binaries.
- **Database tests** run in two places:
  - against staging, through the Supabase tools, inside a transaction that is always rolled back;
  - against a local PostgreSQL 17 with a minimal Supabase-compatible shim (roles, `auth.uid()`, `auth.jwt()`, Vault view). This includes **real concurrent connections** for the rate limiter.
- **App tests** cover:
  - pure logic: redirect safety, phone parsing, error mapping, route decisions, action handlers with injected fakes;
  - HTTP checks against a local production build (protected-route redirects, cache headers, forged cookies).
- **Live sign-in against staging** is a ready-to-run script, `npm run test:e2e:staging`. It needs the dashboard settings in `docs/STAGING.md` and a machine that can reach Supabase.

## D3-11. Legal document hashes cover the page source (pre-launch)

- The privacy notice and terms are still JSX pages. `legal_documents.body_sha256` therefore holds the SHA-256 of each page's **source file** (`npm run legal:hashes`).
- Any edit to either page needs a new version row.
- Before launch, the final texts should be stored as plain text and hashed exactly as shown.
- Staging is seeded with version `2026-11-13-preview-draft` of both.

## D3-12. The staging limiter token is created by the founder, not by Claude

- A value Claude inserts passes through its tool logs, and Claude's workspace cannot reach staging anyway.
- So the founder generates the token and stores it in Vault and in Vercel Preview (`docs/STAGING.md`).
- Until then, code requests on staging fail closed with "temporarily unavailable".

## Found while testing

- **Limiter counters could exceed the limit.** Refused attempts still incremented the counter, so a CAPTCHA refund did not restore an attempt. Fixed by making each counter stop at its limit (`ON CONFLICT … DO UPDATE … WHERE count < limit`). Covered by the database tests and the concurrency test.
- **Supabase requires an SMS provider even for test numbers.** The local `config.toml` enables Twilio with placeholder values. Staging needs the same in the dashboard (`docs/STAGING.md` step 2).
