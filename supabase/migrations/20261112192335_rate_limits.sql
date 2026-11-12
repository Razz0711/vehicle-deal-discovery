-- DealFinder: OTP rate limits (architecture section 8.3; decision D3-1).
-- 5 codes per phone number per day (IST calendar day) and 20 per IP address per hour.
-- Atomic: each counter is one INSERT ... ON CONFLICT DO UPDATE ... WHERE count < limit. The
-- conflicting row is locked and the WHERE is re-checked on its latest version, so concurrent
-- requests are serialised: exactly `limit` of them succeed and the count never passes the limit.

create table private.rate_limits (
  bucket       text not null check (bucket in ('otp_phone_day', 'otp_ip_hour')),
  -- HMAC-SHA256 of the phone number or IP, keyed with the limiter token. No readable numbers.
  key          text not null check (key ~ '^[0-9a-f]{64}$'),
  window_start timestamptz not null,
  count        integer not null default 0 check (count >= 0),
  updated_at   timestamptz not null default now(),
  primary key (bucket, key, window_start)
);
comment on table private.rate_limits is 'OTP request counters. Reached only through private.consume_otp_quota() and private.refund_otp_quota().';

create index rate_limits_window_idx on private.rate_limits (window_start);

-- Not reachable by API roles in any way: no grants, schema not exposed, RLS on with no policies.
revoke all on private.rate_limits from public, anon, authenticated, service_role;
alter table private.rate_limits enable row level security;

-- Returns the limiter token from Vault, refusing if it is missing or the caller's copy differs.
create function private.check_limiter_token(p_token text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  secret text;
begin
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'otp_limiter_token' limit 1;
  if secret is null or char_length(secret) < 32 then
    raise exception 'OTP limiter is not configured' using errcode = '55000';
  end if;
  if p_token is null or p_token <> secret then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  return secret;
end;
$$;
revoke execute on function private.check_limiter_token(text) from public, anon, authenticated, service_role;

create function private.consume_otp_quota(p_token text, p_phone text, p_ip text)
returns table (allowed boolean, reason text, retry_after_seconds integer)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  secret     text := private.check_limiter_token(p_token);
  day_start  timestamptz := date_trunc('day', now(), 'Asia/Kolkata');
  hour_start timestamptz := date_trunc('hour', now());
  ip_count    integer;
  phone_count integer;
begin
  if p_phone is null or p_phone !~ '^\+91[6-9][0-9]{9}$' then
    raise exception 'invalid phone number' using errcode = '22023';
  end if;
  if p_ip is null or char_length(p_ip) not between 1 and 64 then
    raise exception 'invalid client address' using errcode = '22023';
  end if;

  -- IP first: an address over its limit cannot add to anyone's per-number count.
  insert into private.rate_limits as r (bucket, key, window_start, count)
  values ('otp_ip_hour', encode(extensions.hmac('ip:' || p_ip, secret, 'sha256'), 'hex'), hour_start, 1)
  on conflict (bucket, key, window_start) do update set count = r.count + 1, updated_at = now()
    where r.count < 20  -- at the limit: no update, no row returned, count never exceeds the limit
  returning r.count into ip_count;

  if ip_count is null then
    return query select false, 'ip_hourly_limit'::text,
      ceil(extract(epoch from (hour_start + interval '1 hour' - now())))::integer;
    return;
  end if;

  insert into private.rate_limits as r (bucket, key, window_start, count)
  values ('otp_phone_day', encode(extensions.hmac('phone:' || p_phone, secret, 'sha256'), 'hex'), day_start, 1)
  on conflict (bucket, key, window_start) do update set count = r.count + 1, updated_at = now()
    where r.count < 5
  returning r.count into phone_count;

  if phone_count is null then
    return query select false, 'phone_daily_limit'::text,
      ceil(extract(epoch from (day_start + interval '1 day' - now())))::integer;
    return;
  end if;

  return query select true, null::text, 0;
end;
$$;

-- Gives back one per-number attempt when Supabase rejected the request before any SMS
-- (CAPTCHA failure), so scripted requests without a solved CAPTCHA cannot use up a
-- victim's daily quota. The IP count is kept on purpose.
create function private.refund_otp_quota(p_token text, p_phone text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  secret text := private.check_limiter_token(p_token);
begin
  if p_phone is null or p_phone !~ '^\+91[6-9][0-9]{9}$' then
    raise exception 'invalid phone number' using errcode = '22023';
  end if;
  update private.rate_limits
     set count = greatest(count - 1, 0), updated_at = now()
   where bucket = 'otp_phone_day'
     and key = encode(extensions.hmac('phone:' || p_phone, secret, 'sha256'), 'hex')
     and window_start = date_trunc('day', now(), 'Asia/Kolkata');
end;
$$;

-- Callers are signed out (anon) when they ask for a code; the limiter token is the real gate.
revoke execute on function private.consume_otp_quota(text, text, text) from public;
revoke execute on function private.refund_otp_quota(text, text) from public;
grant  usage on schema private to anon, authenticated;
grant  execute on function private.consume_otp_quota(text, text, text) to anon, authenticated;
grant  execute on function private.refund_otp_quota(text, text) to anon, authenticated;

-- Thin security-invoker wrappers: the only API surface (architecture section 6, rule 5).
create function public.consume_otp_quota(p_token text, p_phone text, p_ip text)
returns table (allowed boolean, reason text, retry_after_seconds integer)
language sql
volatile
security invoker
set search_path = ''
as $$ select * from private.consume_otp_quota(p_token, p_phone, p_ip) $$;

create function public.refund_otp_quota(p_token text, p_phone text)
returns void
language sql
volatile
security invoker
set search_path = ''
as $$ select private.refund_otp_quota(p_token, p_phone) $$;

revoke execute on function public.consume_otp_quota(text, text, text) from public;
revoke execute on function public.refund_otp_quota(text, text) from public;
grant  execute on function public.consume_otp_quota(text, text, text) to anon, authenticated;
grant  execute on function public.refund_otp_quota(text, text) to anon, authenticated;
