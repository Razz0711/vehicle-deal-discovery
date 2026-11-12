-- DealFinder: Google sign-in for Phase 3 (decision D3-13).
-- 1. Onboarding accepts a confirmed email (Google) as well as a confirmed phone.
-- 2. Profile email is verified only when it matches the confirmed sign-in address.
-- 3. Optional, unverified mobile number on the profile.

alter table public.profiles
  add column mobile text check (mobile ~ '^[6-9][0-9]{9}$');
comment on column public.profiles.mobile is 'Optional ten-digit Indian mobile number. UNVERIFIED until phone sign-in returns (D3-13).';
grant update (mobile) on public.profiles to authenticated;

drop function public.complete_onboarding(text, text, text, text, text, boolean, uuid, uuid, text, text);
drop function private.complete_onboarding(text, text, text, text, text, boolean, uuid, uuid, text, text);

create function private.complete_onboarding(
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

  chosen_email := coalesce(nullif(btrim(p_email), ''), signin_email);

  insert into public.profiles (id, full_name, email, email_verified_at, state_code, city_name, condition_pref, mobile, is_adult_declared, onboarded_at)
  values (uid, btrim(p_full_name), chosen_email,
          case when email_confirmed is not null and lower(chosen_email) = lower(signin_email) then now_ts end,
          p_state_code, nullif(btrim(p_city_name), ''), p_condition_pref, nullif(btrim(p_mobile), ''), true, now_ts);

  insert into public.consent_events (user_id, purpose, event, document_id, channel, context)
  values (uid, 'privacy_notice', 'acknowledged', current_privacy, p_channel, p_context),
         (uid, 'terms',          'accepted',     current_terms,   p_channel, p_context);

  return now_ts;
end;
$$;
revoke execute on function private.complete_onboarding(text, text, text, text, text, boolean, uuid, uuid, text, text, text) from public, anon;
grant  execute on function private.complete_onboarding(text, text, text, text, text, boolean, uuid, uuid, text, text, text) to authenticated;

create function public.complete_onboarding(
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
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.complete_onboarding(p_full_name, p_email, p_state_code, p_city_name, p_condition_pref,
                                     p_is_adult_declared, p_privacy_document_id, p_terms_document_id,
                                     p_channel, p_context, p_mobile)
$$;
revoke execute on function public.complete_onboarding(text, text, text, text, text, boolean, uuid, uuid, text, text, text) from public, anon;
grant  execute on function public.complete_onboarding(text, text, text, text, text, boolean, uuid, uuid, text, text, text) to authenticated;
