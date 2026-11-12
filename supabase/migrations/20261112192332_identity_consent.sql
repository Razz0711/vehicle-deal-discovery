-- DealFinder: identity and consent (architecture sections 5, 8, 11; review section 8 and 9).
-- Tables: public.profiles, public.legal_documents, public.consent_events.
-- Rules applied to each: RLS on, explicit grants, one policy per operation, roles named in every policy.

-- ---------------------------------------------------------------------------
-- profiles: one row per person, created only by private.complete_onboarding().
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  full_name         text not null check (char_length(btrim(full_name)) between 2 and 100),
  email             text check (email is null or (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$')),
  email_verified_at timestamptz,
  -- Phase 3 stand-in for city_id (decision D3-3). Validated by the server against src/data/locations.ts.
  state_code        text check (state_code ~ '^[A-Z]{2}$'),
  city_name         text check (char_length(city_name) between 1 and 80),
  condition_pref    text check (condition_pref in ('new', 'used')),
  is_adult_declared boolean not null default false,
  onboarded_at      timestamptz,
  status            text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint profiles_onboarded_requires_adult check (onboarded_at is null or is_adult_declared)
);
comment on table public.profiles is 'Buyer identity. Created only through private.complete_onboarding(). status, onboarded_at, email_verified_at and is_adult_declared are never user-writable.';

create unique index profiles_email_lower_key on public.profiles (lower(email)) where email is not null;

alter table public.profiles enable row level security;

grant select on public.profiles to authenticated;
-- Column-level: status, onboarded_at, email_verified_at, is_adult_declared and id are not granted.
grant update (full_name, email, state_code, city_name, condition_pref) on public.profiles to authenticated;

create policy "profiles: read own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create function private.profiles_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.email is distinct from old.email then
    new.email_verified_at := null;  -- a changed address is unverified until proven again
  end if;
  return new;
end;
$$;

create trigger profiles_before_update
  before update on public.profiles
  for each row execute function private.profiles_before_update();

-- ---------------------------------------------------------------------------
-- legal_documents: every version of every text a user agrees to. Immutable.
-- ---------------------------------------------------------------------------
create table public.legal_documents (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null check (kind in ('privacy_notice', 'terms', 'enquiry_share', 'marketing')),
  version        text not null check (char_length(version) between 1 and 40),
  effective_from timestamptz not null,
  body_sha256    text not null check (body_sha256 ~ '^[0-9a-f]{64}$'),
  url            text not null check (url ~ '^(/|https://)'),
  created_at     timestamptz not null default now(),
  unique (kind, version)
);
comment on table public.legal_documents is 'Versioned legal texts. A change is a new row; rows are never updated or deleted.';

create index legal_documents_current_idx on public.legal_documents (kind, effective_from desc);

alter table public.legal_documents enable row level security;

grant select on public.legal_documents to anon, authenticated;

create policy "legal_documents: anyone reads" on public.legal_documents
  for select to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- consent_events: append-only ledger. Current state = latest event per purpose.
-- ---------------------------------------------------------------------------
create table public.consent_events (
  id             bigint generated always as identity primary key,
  -- no cascade: consent proof must outlive a casual delete (decision D3-5)
  user_id        uuid not null references auth.users (id),
  purpose        text not null check (purpose in ('privacy_notice', 'terms', 'enquiry_share', 'marketing_sms', 'marketing_email', 'marketing_whatsapp')),
  -- foreign key to organizations added in Phase 6 (decision D3-4)
  subject_org_id uuid,
  event          text not null check (event in ('acknowledged', 'accepted', 'granted', 'withdrawn')),
  document_id    uuid not null references public.legal_documents (id),
  body_sha256    text not null check (body_sha256 ~ '^[0-9a-f]{64}$'),
  channel        text not null check (channel in ('web', 'app')),
  session_id     uuid,
  context        text not null check (char_length(context) between 1 and 60),
  at             timestamptz not null default now(),
  constraint consent_events_event_matches_purpose check (
       (purpose = 'privacy_notice' and event = 'acknowledged')
    or (purpose = 'terms' and event = 'accepted')
    or (purpose in ('enquiry_share', 'marketing_sms', 'marketing_email', 'marketing_whatsapp') and event in ('granted', 'withdrawn'))
  ),
  constraint consent_events_subject_org_only_for_enquiry_share check ((purpose = 'enquiry_share') = (subject_org_id is not null))
);
comment on table public.consent_events is 'Append-only consent ledger. No role may update, delete or truncate. body_sha256, at and session_id are set by trigger, never by the client.';

create index consent_events_current_idx on public.consent_events (user_id, purpose, subject_org_id, at desc);

alter table public.consent_events enable row level security;

grant select on public.consent_events to authenticated;
-- Column-level insert: id, at, body_sha256 and session_id are not granted (set by default or trigger).
grant insert (user_id, purpose, subject_org_id, event, document_id, channel, context) on public.consent_events to authenticated;

create policy "consent_events: read own" on public.consent_events
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Phase 3: enquiry_share is refused here; it opens in Phase 6 with organizations (D3-4).
create policy "consent_events: add own" on public.consent_events
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, true) = false
    and purpose in ('privacy_notice', 'terms', 'marketing_sms', 'marketing_email', 'marketing_whatsapp')
  );

-- Fills the proof fields from trusted sources and checks the document matches the purpose.
create function private.consent_events_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  doc public.legal_documents%rowtype;
  expected_kind text;
  claims jsonb := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
begin
  select * into doc from public.legal_documents where id = new.document_id;
  if not found then
    raise exception 'unknown legal document' using errcode = '23503';
  end if;
  expected_kind := case
    when new.purpose = 'privacy_notice' then 'privacy_notice'
    when new.purpose = 'terms' then 'terms'
    when new.purpose = 'enquiry_share' then 'enquiry_share'
    else 'marketing'
  end;
  if doc.kind <> expected_kind then
    raise exception 'document kind % does not match purpose %', doc.kind, new.purpose using errcode = '23514';
  end if;
  if doc.effective_from > now() then
    raise exception 'document version is not yet in effect' using errcode = '23514';
  end if;
  new.body_sha256 := doc.body_sha256;   -- never trust a client-supplied hash
  new.at := now();                      -- never trust a client-supplied time
  if claims ? 'session_id' then
    new.session_id := (claims ->> 'session_id')::uuid;
  end if;
  return new;
end;
$$;

create trigger consent_events_before_insert
  before insert on public.consent_events
  for each row execute function private.consent_events_before_insert();

-- Append-only and immutable, for every role including the table owner and service_role.
create function private.forbid_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% is append-only: % is not allowed', tg_table_schema || '.' || tg_table_name, lower(tg_op)
    using errcode = '42501';
end;
$$;

create trigger consent_events_no_update_delete
  before update or delete on public.consent_events
  for each row execute function private.forbid_change();
create trigger consent_events_no_truncate
  before truncate on public.consent_events
  for each statement execute function private.forbid_change();

create trigger legal_documents_no_update_delete
  before update or delete on public.legal_documents
  for each row execute function private.forbid_change();
create trigger legal_documents_no_truncate
  before truncate on public.legal_documents
  for each statement execute function private.forbid_change();
