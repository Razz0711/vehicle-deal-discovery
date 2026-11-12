-- DealFinder: baseline privileges (architecture section 6, rules 1, 2 and 7).
-- Objects created by `postgres` in `public` no longer get automatic grants for API roles.
-- Every table and function must be granted explicitly, in the migration that creates it.

alter default privileges for role postgres in schema public revoke all on tables    from anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated, service_role;

-- Global: new functions are not executable by PUBLIC (no `in schema`, so it applies everywhere).
alter default privileges for role postgres revoke execute on functions from public;

-- Privileged helpers and limiter state. Not exposed through the Data API (config: schemas = ["public"]).
create schema if not exists private;
revoke all on schema private from public;
comment on schema private is 'DealFinder privileged helpers and internal tables. Never add to the Data API exposed schemas.';
