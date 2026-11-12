/**
 * Phase 3 database security tests: specification.
 * `node scripts/db-tests.mjs generate` turns this into supabase/tests/phase3_security.test.sql,
 * one DO block that runs as `postgres`, switches into API roles with simulated JWT claims,
 * and ALWAYS ends by raising its summary, so every change is rolled back (safe on staging).
 *
 * expect: "ok" (no error) | "error:<SQLSTATE>" | any other string (the query's single value, as text)
 */

export const USERS = {
  A: { id: "aaaaaaaa-0000-4000-8000-00000000000a", phone: "919000000101", session: "5e550000-0000-4000-8000-00000000000a" },
  B: { id: "bbbbbbbb-0000-4000-8000-00000000000b", phone: "919000000102", session: "5e550000-0000-4000-8000-00000000000b" },
  ANON_USER: { id: "cccccccc-0000-4000-8000-00000000000c", phone: null, session: "5e550000-0000-4000-8000-00000000000c", anonymous: true },
  UNVERIFIED: { id: "dddddddd-0000-4000-8000-00000000000d", phone: "919000000104", session: "5e550000-0000-4000-8000-00000000000d", unconfirmed: true },
  // Google sign-in (D3-13): confirmed email, no phone.
  G1: { id: "eeeeeeee-0000-4000-8000-00000000000e", phone: null, email: "dftest.g1@example.com", session: "5e550000-0000-4000-8000-00000000000e" },
  G2: { id: "ffffffff-0000-4000-8000-00000000000f", phone: null, email: "dftest.g2@example.com", session: "5e550000-0000-4000-8000-00000000000f" },
};

// Fixed hashes for the test-only document versions created inside the rolled-back transaction.
const H = (c) => c.repeat(64);

export const SETUP = `
insert into auth.users (id, aud, role, phone, phone_confirmed_at, email, email_confirmed_at, is_anonymous) values
  ('${USERS.A.id}', 'authenticated', 'authenticated', '${USERS.A.phone}', now(), null, null, false),
  ('${USERS.B.id}', 'authenticated', 'authenticated', '${USERS.B.phone}', now(), null, null, false),
  ('${USERS.ANON_USER.id}', 'authenticated', 'authenticated', null, null, null, null, true),
  ('${USERS.UNVERIFIED.id}', 'authenticated', 'authenticated', '${USERS.UNVERIFIED.phone}', null, 'dftest.unverified@example.com', null, false),
  ('${USERS.G1.id}', 'authenticated', 'authenticated', null, null, '${USERS.G1.email}', now(), false),
  ('${USERS.G2.id}', 'authenticated', 'authenticated', null, null, '${USERS.G2.email}', now(), false);
-- Test document versions. "current" ones are the latest in effect; "old" and "future" are not current.
insert into public.legal_documents (id, kind, version, effective_from, body_sha256, url) values
  ('10000000-0000-4000-8000-000000000001', 'privacy_notice', 'dftest-old',     now() - interval '2 days',   '${H("1")}', '/privacy'),
  ('10000000-0000-4000-8000-000000000002', 'privacy_notice', 'dftest-current', now() - interval '1 second', '${H("2")}', '/privacy'),
  ('10000000-0000-4000-8000-000000000003', 'privacy_notice', 'dftest-future',  now() + interval '2 days',   '${H("3")}', '/privacy'),
  ('20000000-0000-4000-8000-000000000002', 'terms',          'dftest-current', now() - interval '1 second', '${H("4")}', '/terms'),
  ('30000000-0000-4000-8000-000000000001', 'marketing',      'dftest-current', now() - interval '1 second', '${H("5")}', '/privacy'),
  ('40000000-0000-4000-8000-000000000001', 'enquiry_share',  'dftest-current', now() - interval '1 second', '${H("6")}', '/privacy');
-- Limiter token: use the configured one if present (never printed); otherwise create a test one.
if not exists (select 1 from vault.decrypted_secrets where name = 'otp_limiter_token') then
  perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'otp_limiter_token');
end if;
select decrypted_secret into token from vault.decrypted_secrets where name = 'otp_limiter_token';
`;

const P = "'10000000-0000-4000-8000-000000000002'"; // current privacy
const PO = "'10000000-0000-4000-8000-000000000001'"; // old privacy
const PF = "'10000000-0000-4000-8000-000000000003'"; // future privacy
const T = "'20000000-0000-4000-8000-000000000002'"; // current terms
const M = "'30000000-0000-4000-8000-000000000001'"; // marketing
const onboard = (adult = "true", privacy = P, name = "Asha Patel", email = "asha@example.com", mobile = "null") =>
  `select public.complete_onboarding('${name}', '${email}', 'GJ', 'Ahmedabad', 'new', ${adult}, ${privacy}, ${T}, 'web', 'register', ${mobile})::text is not null`;

export const CASES = [
  // --- signed-out visitors (anon) ---
  { name: "anon cannot read profiles", as: "anon", sql: "select count(*) from public.profiles", expect: "error:42501" },
  { name: "anon can read legal documents", as: "anon", sql: "select count(*) > 0 from public.legal_documents", expect: "true" },
  { name: "anon cannot read consent events", as: "anon", sql: "select count(*) from public.consent_events", expect: "error:42501" },
  { name: "anon cannot insert consent events", as: "anon", sql: `insert into public.consent_events (user_id, purpose, event, document_id, channel, context) values ('${USERS.A.id}', 'terms', 'accepted', ${T}, 'web', 'x')`, expect: "error:42501" },
  { name: "anon cannot read private.rate_limits", as: "anon", sql: "select count(*) from private.rate_limits", expect: "error:42501" },
  { name: "anon cannot call complete_onboarding", as: "anon", sql: onboard(), expect: "error:42501" },
  { name: "anon cannot read the Vault", as: "anon", sql: "select count(*) from vault.decrypted_secrets", expect: "error:42501" },
  { name: "limiter refuses a wrong token", as: "anon", sql: "select allowed::text from public.consume_otp_quota('wrong-token-wrong-token-wrong-token', '+919000000101', '203.0.113.9')", expect: "error:42501" },
  { name: "limiter refuses a missing token", as: "anon", sql: "select allowed::text from public.consume_otp_quota(null, '+919000000101', '203.0.113.9')", expect: "error:42501" },
  { name: "anon cannot call the token check directly", as: "anon", sql: "select private.check_limiter_token('x') is not null", expect: "error:42501" },

  // --- registration ---
  { name: "B: not registered before onboarding", as: "B", sql: "select private.is_registered_buyer()::text", expect: "false" },
  { name: "B: no profile visible before onboarding", as: "B", sql: "select count(*)::text from public.profiles", expect: "0" },
  { name: "A: cannot insert a profile directly", as: "A", sql: `insert into public.profiles (id, full_name, is_adult_declared, onboarded_at) values ('${USERS.A.id}', 'Asha', true, now())`, expect: "error:42501" },
  { name: "A: onboarding refused without adult declaration", as: "A", sql: onboard("false"), expect: "error:22023" },
  { name: "A: onboarding refused with an old privacy version", as: "A", sql: onboard("true", PO), expect: "error:22023" },
  { name: "A: onboarding refused with a future privacy version", as: "A", sql: onboard("true", PF), expect: "error:22023" },
  { name: "A: onboarding succeeds", as: "A", sql: onboard(), expect: "true" },
  { name: "A: profile is onboarded, active, adult", as: "A", sql: "select (onboarded_at is not null and status = 'active' and is_adult_declared)::text from public.profiles", expect: "true" },
  { name: "A: is now a registered buyer", as: "A", sql: "select private.is_registered_buyer()::text", expect: "true" },
  { name: "A: two consent events recorded", as: "A", sql: "select string_agg(purpose || '/' || event, ',' order by purpose) from public.consent_events", expect: "privacy_notice/acknowledged,terms/accepted" },
  { name: "A: consent hashes copied from the documents", as: "A", sql: "select bool_and(c.body_sha256 = d.body_sha256)::text from public.consent_events c join public.legal_documents d on d.id = c.document_id", expect: "true" },
  { name: "A: consent session id taken from the JWT", as: "A", sql: `select bool_and(session_id = '${USERS.A.session}')::text from public.consent_events`, expect: "true" },
  { name: "A: second onboarding refused", as: "A", sql: onboard(), expect: "error:23505" },
  { name: "B: onboarding with an email already used is refused", as: "B", sql: onboard("true", P, "Bina Shah", "ASHA@example.com"), expect: "error:23505" },
  { name: "B: onboarding succeeds", as: "B", sql: onboard("true", P, "Bina Shah", "bina@example.com"), expect: "true" },

  // --- anonymous and unverified users ---
  { name: "anonymous user cannot onboard", as: "ANON_USER", sql: onboard("true", P, "Anon", "anon@example.com"), expect: "error:42501" },
  { name: "anonymous user is not a registered buyer", as: "ANON_USER", sql: "select private.is_registered_buyer()::text", expect: "false" },
  { name: "anonymous user cannot add consent events", as: "ANON_USER", sql: `insert into public.consent_events (user_id, purpose, event, document_id, channel, context) values ('${USERS.ANON_USER.id}', 'terms', 'accepted', ${T}, 'web', 'x')`, expect: "error:42501" },
  { name: "unverified identity (no confirmed phone or email) cannot onboard", as: "UNVERIFIED", sql: onboard("true", P, "Unverified", "u@example.com"), expect: "error:42501" },

  // --- Google sign-in (D3-13) ---
  { name: "Google user: onboarding with a malformed mobile is refused", as: "G1", sql: onboard("true", P, "Gita One", USERS.G1.email, "'12345'"), expect: "error:23514" },
  { name: "Google user: onboarding with own Google email succeeds", as: "G1", sql: onboard("true", P, "Gita One", USERS.G1.email, "'9876543210'"), expect: "true" },
  { name: "Google user: matching email is marked verified, mobile stored", as: "G1", sql: "select (email_verified_at is not null and mobile = '9876543210')::text from public.profiles", expect: "true" },
  { name: "Google user: empty email defaults to the Google address", as: "G2", sql: onboard("true", P, "Gita Two", ""), expect: "true" },
  { name: "Google user: defaulted address is the sign-in address and verified", as: "G2", sql: "select (email = '" + USERS.G2.email + "' and email_verified_at is not null and mobile is null)::text from public.profiles", expect: "true" },
  { name: "Google user: changing email later clears verification", as: "G2", sql: `with u as (update public.profiles set email = 'other@example.com' where id = '${USERS.G2.id}' returning email_verified_at) select (email_verified_at is null)::text from u`, expect: "true" },
  { name: "Google user: can add an unverified mobile later", as: "G2", sql: `with u as (update public.profiles set mobile = '9123456780' where id = '${USERS.G2.id}' returning mobile) select mobile from u`, expect: "9123456780" },
  { name: "Google user: malformed mobile update refused", as: "G2", sql: `update public.profiles set mobile = '+91 91234' where id = '${USERS.G2.id}'`, expect: "error:23514" },
  { name: "Google user: is a registered buyer", as: "G1", sql: "select private.is_registered_buyer()::text", expect: "true" },
  { name: "Google user cannot see another Google user's profile", as: "G1", sql: `select count(*)::text from public.profiles where id = '${USERS.G2.id}'`, expect: "0" },

  // --- cross-user isolation: profiles ---
  { name: "A sees only their own profile", as: "A", sql: `select string_agg(id::text, ',') from public.profiles`, expect: USERS.A.id },
  { name: "A cannot read B's profile by id", as: "A", sql: `select count(*)::text from public.profiles where id = '${USERS.B.id}'`, expect: "0" },
  { name: "A's update of B's profile changes nothing", as: "A", sql: `with u as (update public.profiles set full_name = 'Hacked' where id = '${USERS.B.id}' returning 1) select count(*)::text from u`, expect: "0" },
  { name: "B's name is unchanged", as: "postgres", sql: `select full_name from public.profiles where id = '${USERS.B.id}'`, expect: "Bina Shah" },
  { name: "A can update their own name", as: "A", sql: `with u as (update public.profiles set full_name = 'Asha P' where id = '${USERS.A.id}' returning 1) select count(*)::text from u`, expect: "1" },
  { name: "A cannot change their status", as: "A", sql: `update public.profiles set status = 'active' where id = '${USERS.A.id}'`, expect: "error:42501" },
  { name: "A cannot set onboarded_at", as: "A", sql: `update public.profiles set onboarded_at = now() where id = '${USERS.A.id}'`, expect: "error:42501" },
  { name: "A cannot set email_verified_at", as: "A", sql: `update public.profiles set email_verified_at = now() where id = '${USERS.A.id}'`, expect: "error:42501" },
  { name: "A cannot change is_adult_declared", as: "A", sql: `update public.profiles set is_adult_declared = true where id = '${USERS.A.id}'`, expect: "error:42501" },
  { name: "A cannot change their profile id", as: "A", sql: `update public.profiles set id = '${USERS.B.id}' where id = '${USERS.A.id}'`, expect: "error:42501" },
  { name: "A cannot delete their profile", as: "A", sql: `delete from public.profiles where id = '${USERS.A.id}'`, expect: "error:42501" },
  { name: "setup: mark A's email verified (as owner)", as: "postgres", sql: `with u as (update public.profiles set email_verified_at = now() where id = '${USERS.A.id}' returning 1) select count(*)::text from u`, expect: "1" },
  { name: "A changing email clears email_verified_at", as: "A", sql: `with u as (update public.profiles set email = 'asha.new@example.com' where id = '${USERS.A.id}' returning email_verified_at) select (email_verified_at is null)::text from u`, expect: "true" },

  // --- consent ledger ---
  { name: "A sees only their own consent events", as: "A", sql: `select count(*)::text from public.consent_events where user_id <> '${USERS.A.id}'`, expect: "0" },
  { name: "A cannot record consent for B", as: "A", sql: `insert into public.consent_events (user_id, purpose, event, document_id, channel, context) values ('${USERS.B.id}', 'marketing_sms', 'granted', ${M}, 'web', 'x')`, expect: "error:42501" },
  { name: "A cannot use a document of the wrong kind", as: "A", sql: `insert into public.consent_events (user_id, purpose, event, document_id, channel, context) values ('${USERS.A.id}', 'marketing_sms', 'granted', ${P}, 'web', 'x')`, expect: "error:23514" },
  { name: "A cannot pair a purpose with the wrong event", as: "A", sql: `insert into public.consent_events (user_id, purpose, event, document_id, channel, context) values ('${USERS.A.id}', 'terms', 'granted', ${T}, 'web', 'x')`, expect: "error:23514" },
  { name: "A cannot supply their own hash", as: "A", sql: `insert into public.consent_events (user_id, purpose, event, document_id, channel, context, body_sha256) values ('${USERS.A.id}', 'marketing_sms', 'granted', ${M}, 'web', 'x', '${H("f")}')`, expect: "error:42501" },
  { name: "A cannot backdate an event", as: "A", sql: `insert into public.consent_events (user_id, purpose, event, document_id, channel, context, at) values ('${USERS.A.id}', 'marketing_sms', 'granted', ${M}, 'web', 'x', now() - interval '1 year')`, expect: "error:42501" },
  { name: "A cannot record enquiry_share in Phase 3", as: "A", sql: `insert into public.consent_events (user_id, purpose, event, document_id, channel, context, subject_org_id) values ('${USERS.A.id}', 'enquiry_share', 'granted', '40000000-0000-4000-8000-000000000001', 'web', 'x', gen_random_uuid())`, expect: "error:42501" },
  { name: "A can grant marketing consent", as: "A", sql: `with i as (insert into public.consent_events (user_id, purpose, event, document_id, channel, context) values ('${USERS.A.id}', 'marketing_sms', 'granted', ${M}, 'web', 'settings') returning body_sha256) select body_sha256 from i`, expect: H("5") },
  { name: "A can withdraw it (new row, history kept)", as: "A", sql: `insert into public.consent_events (user_id, purpose, event, document_id, channel, context) values ('${USERS.A.id}', 'marketing_sms', 'withdrawn', ${M}, 'web', 'settings')`, expect: "ok" },
  { name: "latest marketing state is withdrawn; history has 2 rows", as: "A", sql: `select (select event from public.consent_events where purpose = 'marketing_sms' order by at desc, id desc limit 1) || '/' || (select count(*) from public.consent_events where purpose = 'marketing_sms')`, expect: "withdrawn/2" },
  { name: "A cannot update a consent event", as: "A", sql: "update public.consent_events set event = 'granted'", expect: "error:42501" },
  { name: "A cannot delete a consent event", as: "A", sql: "delete from public.consent_events", expect: "error:42501" },
  { name: "owner cannot update a consent event", as: "postgres", sql: "update public.consent_events set context = 'tampered'", expect: "error:42501" },
  { name: "owner cannot delete a consent event", as: "postgres", sql: "delete from public.consent_events", expect: "error:42501" },
  { name: "owner cannot truncate consent events", as: "postgres", sql: "truncate public.consent_events", expect: "error:42501" },
  { name: "service_role cannot update a consent event", as: "service_role", sql: "update public.consent_events set context = 'tampered'", expect: "error:42501" },
  { name: "deleting a user with consent history is blocked", as: "postgres", sql: `delete from auth.users where id = '${USERS.A.id}'`, expect: "error:23503" },
  { name: "owner cannot alter a legal document", as: "postgres", sql: `update public.legal_documents set body_sha256 = '${H("0")}'`, expect: "error:42501" },
  { name: "users cannot add legal documents", as: "A", sql: `insert into public.legal_documents (kind, version, effective_from, body_sha256, url) values ('terms', 'evil', now(), '${H("9")}', '/terms')`, expect: "error:42501" },

  // --- privilege escalation ---
  { name: "A cannot read private.rate_limits", as: "A", sql: "select count(*) from private.rate_limits", expect: "error:42501" },
  { name: "A cannot read the Vault", as: "A", sql: "select count(*) from vault.decrypted_secrets", expect: "error:42501" },
  { name: "suspended user is not a registered buyer", as: "A", setup: `update public.profiles set status = 'suspended' where id = '${USERS.A.id}';`, sql: "select private.is_registered_buyer()::text", expect: "false" },

  // --- rate limiting (sequential; concurrency is tested separately on real connections) ---
  { name: "limiter: 5 codes per number are allowed", as: "anon", sql: "select string_agg(allowed::text, ',') from (select (public.consume_otp_quota(%TOKEN%, '+919000000201', '198.51.100.' || g)).allowed from generate_series(1, 5) g) s", expect: "true,true,true,true,true" },
  { name: "limiter: the 6th code for that number is refused", as: "anon", sql: "select allowed::text || '/' || reason from public.consume_otp_quota(%TOKEN%, '+919000000201', '198.51.100.99')", expect: "false/phone_daily_limit" },
  { name: "limiter: a CAPTCHA-failure refund is accepted", as: "anon", sql: "select public.refund_otp_quota(%TOKEN%, '+919000000201')", expect: "ok" },
  { name: "limiter: after the refund, one more code is allowed", as: "anon", sql: "select allowed::text from public.consume_otp_quota(%TOKEN%, '+919000000201', '198.51.100.98')", expect: "true" },
  { name: "limiter: and then the number is refused again", as: "anon", sql: "select allowed::text from public.consume_otp_quota(%TOKEN%, '+919000000201', '198.51.100.97')", expect: "false" },
  { name: "limiter: 20 codes per IP per hour are allowed", as: "anon", sql: "select count(*) filter (where allowed)::text from (select (public.consume_otp_quota(%TOKEN%, '+9190000003' || lpad(g::text, 2, '0'), '192.0.2.50')).allowed from generate_series(1, 20) g) s", expect: "20" },
  { name: "limiter: the 21st code from that IP is refused", as: "anon", sql: "select allowed::text || '/' || reason from public.consume_otp_quota(%TOKEN%, '+919000000399', '192.0.2.50')", expect: "false/ip_hourly_limit" },
  { name: "limiter: an IP refusal does not use up the number's quota", as: "postgres", sql: "select count(*)::text from private.rate_limits where bucket = 'otp_phone_day' and key = encode(extensions.hmac('phone:+919000000399', %TOKEN%, 'sha256'), 'hex')", expect: "0" },
  { name: "limiter: refuses a malformed number", as: "anon", sql: "select allowed::text from public.consume_otp_quota(%TOKEN%, '9000000201', '198.51.100.1')", expect: "error:22023" },
  { name: "limiter: stores no readable phone numbers", as: "postgres", sql: "select count(*)::text from private.rate_limits where key like '%9000000201%' or key !~ '^[0-9a-f]{64}$'", expect: "0" },

  // --- structural privilege assertions ---
  { name: "RLS enabled on every public table", as: "postgres", sql: "select count(*)::text from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r','p') and not c.relrowsecurity", expect: "0" },
  { name: "no security definer function in public", as: "postgres", sql: "select count(*)::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prosecdef", expect: "0" },
  { name: "anon can execute only the two limiter functions in public", as: "postgres", sql: "select coalesce(string_agg(p.proname, ',' order by p.proname), '') from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')", expect: "consume_otp_quota,refund_otp_quota" },
  { name: "API roles have no privileges on private tables", as: "postgres", sql: "select count(*)::text from pg_class c join pg_namespace n on n.oid = c.relnamespace, unnest(array['anon','authenticated','service_role']) r where n.nspname = 'private' and c.relkind = 'r' and (has_table_privilege(r, c.oid, 'select') or has_table_privilege(r, c.oid, 'insert') or has_table_privilege(r, c.oid, 'update') or has_table_privilege(r, c.oid, 'delete'))", expect: "0" },
  { name: "private security definer functions pin search_path", as: "postgres", sql: "select count(*)::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'private' and p.prosecdef and not coalesce(p.proconfig @> array['search_path=\"\"'], false)", expect: "0" },
  { name: "authenticated may update only the six named profile columns", as: "postgres", sql: "select string_agg(attname, ',' order by attname) from pg_attribute where attrelid = 'public.profiles'::regclass and attnum > 0 and not attisdropped and has_column_privilege('authenticated', attrelid, attnum, 'update')", expect: "city_name,condition_pref,email,full_name,mobile,state_code" },
  { name: "no API role has delete on any Phase 3 table", as: "postgres", sql: "select count(*)::text from unnest(array['public.profiles','public.legal_documents','public.consent_events']) t, unnest(array['anon','authenticated','service_role']) r where has_table_privilege(r, t::regclass, 'delete')", expect: "0" },
];

function claims(who) {
  if (who === "anon") return { role: "anon" };
  if (who === "service_role") return { role: "service_role" };
  const u = USERS[who];
  return { sub: u.id, role: "authenticated", aud: "authenticated", is_anonymous: !!u.anonymous, session_id: u.session, aal: "aal1", phone: u.phone ?? "", email: u.email ?? "" };
}

const q = (s) => "$q$" + s + "$q$";

// One temporary runner function keeps the generated SQL small. It switches into the API role
// with the given claims, runs one case, and reports the outcome; its exception block undoes the case.
const RUNNER = `
create function pg_temp.dft(t text, r text, c text, q text, e text, tok text) returns jsonb language plpgsql as $f$
declare v text;
begin
  perform set_config('request.jwt.claims', c, true);
  if r is not null then execute format('set local role %I', r); end if;
  q := replace(q, '%TOKEN%', quote_literal(tok));
  if e = 'ok' or e like 'error:%' then execute q; else execute q into v; end if;
  if r is not null then reset role; end if;
  if e like 'error:%' then return jsonb_build_object('t', t, 'ok', false, 'got', 'no error'); end if;
  if e = 'ok' or v is not distinct from e then return jsonb_build_object('t', t, 'ok', true); end if;
  return jsonb_build_object('t', t, 'ok', false, 'got', coalesce(v, 'NULL'));
exception when others then
  if e = 'error:' || sqlstate then return jsonb_build_object('t', t, 'ok', true, 'err', sqlstate); end if;
  return jsonb_build_object('t', t, 'ok', false, 'got', sqlstate || ' ' || sqlerrm);
end $f$;
`;

export function generateSql() {
  const lines = [];
  lines.push("-- GENERATED by scripts/db-tests.mjs from supabase/tests/phase3-security.cases.mjs. Do not edit.");
  lines.push("-- Safe on staging: the block always raises its summary at the end, which rolls everything back.");
  lines.push(RUNNER.trim());
  lines.push("do $dftest$");
  lines.push("declare token text; r jsonb; results jsonb := '[]'::jsonb;");
  lines.push("begin");
  lines.push(SETUP.trim());
  for (const c of CASES) {
    const role = c.as === "postgres" ? "null" : c.as === "anon" ? "'anon'" : c.as === "service_role" ? "'service_role'" : "'authenticated'";
    const cl = c.as === "postgres" ? "{}" : JSON.stringify(claims(c.as));
    if (c.setup) lines.push(c.setup);
    lines.push(`results := results || pg_temp.dft(${q(c.name)}, ${role}, ${q(cl)}, ${q(c.sql)}, ${q(c.expect)}, token);`);
  }
  lines.push("raise exception 'DFTEST_SUMMARY %', jsonb_build_object(");
  lines.push("  'passed', (select count(*) from jsonb_array_elements(results) x where (x->>'ok')::boolean),");
  lines.push("  'failed', (select count(*) from jsonb_array_elements(results) x where not (x->>'ok')::boolean),");
  lines.push("  'results', results)::text;");
  lines.push("end");
  lines.push("$dftest$;");
  return lines.join("\n") + "\n";
}
