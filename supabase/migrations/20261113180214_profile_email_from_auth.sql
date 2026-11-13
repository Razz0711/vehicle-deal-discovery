-- DealFinder: profile email follows the verified sign-in address (decision D3-14).
-- Found in live testing: users could edit profiles.email, which cleared email_verified_at with no
-- way back. The email now comes only from Supabase Auth and is not user-editable.

revoke update (email) on public.profiles from authenticated;
comment on column public.profiles.email is 'Verified sign-in address from Supabase Auth (lower-case), or an unverified contact address for phone-only accounts. Not user-editable.';

-- Clear verification only when the address changes without a matching verification update.
create or replace function private.profiles_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.email is distinct from old.email and new.email_verified_at is not distinct from old.email_verified_at then
    new.email_verified_at := null;
  end if;
  return new;
end;
$$;

create or replace function private.complete_onboarding(
  p_full_name           text,
  p_email               text,
  p_state_code          text,
  p_city_name           text,
  p_condition_pref      text,
  p_is_adult_declared   boolean,
  p_privacy_document_id uuid,
  p_terms_document_id   uuid,
  p_channel             text,
  p_context             text,
  p_mobile              text default null
)
returns timestamptz
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  uid     uuid := (select auth.uid());
  claims  jsonb := (select auth.jwt());
  now_ts  timestamptz := now();
  signin_email     text;
  email_confirmed  timestamptz;
  verified         boolean;
  chosen_email     text;
  chosen_verified  timestamptz;
  current_privacy  uuid;
  current_terms    uuid;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if coalesce((claims ->> 'is_anonymous')::boolean, true) then
    raise exception 'anonymous users cannot register' using errcode = '42501';
  end if;
  select u.email, u.email_confirmed_at, (u.phone_confirmed_at is not null or u.email_confirmed_at is not null)
    into signin_email, email_confirmed, verified
    from auth.users u where u.id = uid;
  if not coalesce(verified, false) then
    raise exception 'sign-in identity is not verified' using errcode = '42501';
  end if;
  if exists (select 1 from public.profiles p where p.id = uid) then
    raise exception 'already registered' using errcode = '23505';
  end if;
  if p_is_adult_declared is distinct from true then
    raise exception 'adult declaration is required' using errcode = '22023';
  end if;

  select id into current_privacy from public.legal_documents
   where kind = 'privacy_notice' and effective_from <= now_ts order by effective_from desc limit 1;
  select id into current_terms from public.legal_documents
   where kind = 'terms' and effective_from <= now_ts order by effective_from desc limit 1;
  if current_privacy is null or current_terms is null then
    raise exception 'legal documents are not configured' using errcode = '55000';
  end if;
  if p_privacy_document_id is distinct from current_privacy or p_terms_document_id is distinct from current_terms then
    raise exception 'legal document version is not current' using errcode = '22023';
  end if;

  -- A confirmed sign-in address (Google) is the profile email; a different one is refused (D3-14).
  if email_confirmed is not null then
    chosen_email := lower(signin_email);
    chosen_verified := email_confirmed;
    if nullif(btrim(p_email), '') is not null and lower(btrim(p_email)) <> chosen_email then
      raise exception 'email must match the address you signed in with' using errcode = '22023';
    end if;
  else
    -- Phone-only sign-in (future): an optional contact address, stored unverified.
    chosen_email := nullif(lower(btrim(p_email)), '');
    chosen_verified := null;
  end if;

  insert into public.profiles (id, full_name, email, email_verified_at, state_code, city_name, condition_pref, mobile, is_adult_declared, onboarded_at)
  values (uid, btrim(p_full_name), chosen_email,
          chosen_verified,
          p_state_code, nullif(btrim(p_city_name), ''), p_condition_pref, nullif(btrim(p_mobile), ''), true, now_ts);

  insert into public.consent_events (user_id, purpose, event, document_id, channel, context)
  values (uid, 'privacy_notice', 'acknowledged', current_privacy, p_channel, p_context),
         (uid, 'terms',          'accepted',     current_terms,   p_channel, p_context);

  return now_ts;
end;
$$;

-- One-time correction: profiles of accounts with a confirmed sign-in email take that address and its
-- confirmation time (restores the verification cleared during live testing on 13 Nov 2026).
update public.profiles p
   set email = lower(u.email),
       email_verified_at = u.email_confirmed_at
  from auth.users u
 where u.id = p.id
   and u.email_confirmed_at is not null
   and (p.email is distinct from lower(u.email) or p.email_verified_at is distinct from u.email_confirmed_at);
