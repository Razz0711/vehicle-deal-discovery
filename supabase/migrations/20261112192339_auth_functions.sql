-- DealFinder: registration helpers (architecture sections 3, 6, 8; decisions D3-2, D3-9).

-- True only for a non-anonymous user with a completed, active profile.
-- Used by restrictive policies on commercial tables from Phase 4 on, and by tests now.
create function private.is_registered_buyer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, true) = false
     and exists (
       select 1 from public.profiles p
        where p.id = (select auth.uid())
          and p.onboarded_at is not null
          and p.status = 'active'
     );
$$;
revoke execute on function private.is_registered_buyer() from public, anon;
grant  execute on function private.is_registered_buyer() to authenticated;

-- Creates the profile and records the two required consents in one transaction.
-- Acts only for auth.uid(); never accepts a user id.
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
  p_context             text
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
  current_privacy uuid;
  current_terms   uuid;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if coalesce((claims ->> 'is_anonymous')::boolean, true) then
    raise exception 'anonymous users cannot register' using errcode = '42501';
  end if;
  if not exists (select 1 from auth.users u where u.id = uid and u.phone_confirmed_at is not null) then
    raise exception 'phone number is not verified' using errcode = '42501';
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

  insert into public.profiles (id, full_name, email, state_code, city_name, condition_pref, is_adult_declared, onboarded_at)
  values (uid, btrim(p_full_name), nullif(btrim(p_email), ''), p_state_code, nullif(btrim(p_city_name), ''),
          p_condition_pref, true, now_ts);

  insert into public.consent_events (user_id, purpose, event, document_id, channel, context)
  values (uid, 'privacy_notice', 'acknowledged', current_privacy, p_channel, p_context),
         (uid, 'terms',          'accepted',     current_terms,   p_channel, p_context);

  return now_ts;
end;
$$;
revoke execute on function private.complete_onboarding(text, text, text, text, text, boolean, uuid, uuid, text, text) from public, anon;
grant  execute on function private.complete_onboarding(text, text, text, text, text, boolean, uuid, uuid, text, text) to authenticated;

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
  p_context             text
)
returns timestamptz
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.complete_onboarding(p_full_name, p_email, p_state_code, p_city_name, p_condition_pref,
                                     p_is_adult_declared, p_privacy_document_id, p_terms_document_id, p_channel, p_context)
$$;
revoke execute on function public.complete_onboarding(text, text, text, text, text, boolean, uuid, uuid, text, text) from public, anon;
grant  execute on function public.complete_onboarding(text, text, text, text, text, boolean, uuid, uuid, text, text) to authenticated;
