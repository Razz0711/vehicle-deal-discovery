-- LOCAL TEST SHIM ONLY. Never run against a Supabase project.
-- Recreates the small part of a Supabase database that DealFinder's migrations depend on,
-- so they can be tested on a plain PostgreSQL 17 when the Supabase Docker stack is unavailable.
-- auth.uid() and auth.jwt() use Supabase's own definitions (copied from the staging project).

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then create role authenticator login noinherit password 'localtest'; end if;
end $$;
grant anon, authenticated, service_role to authenticator;

-- Supabase's default: API roles can use public and get automatic grants (the baseline migration revokes these).
grant usage on schema public to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant execute on functions to anon, authenticated, service_role;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;

create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;
create table if not exists auth.users (
  id uuid primary key,
  instance_id uuid,
  aud text,
  role text,
  email text,
  phone text unique,
  phone_confirmed_at timestamptz,
  is_anonymous boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb
$$;
grant execute on function auth.uid(), auth.jwt() to anon, authenticated, service_role;

create schema if not exists vault;
create table if not exists vault.secrets (id uuid primary key default gen_random_uuid(), name text unique, secret text not null);
create or replace view vault.decrypted_secrets as select id, name, secret as decrypted_secret from vault.secrets;
create or replace function vault.create_secret(new_secret text, new_name text) returns uuid language sql as $$
  insert into vault.secrets (name, secret) values (new_name, new_secret) returning id
$$;
