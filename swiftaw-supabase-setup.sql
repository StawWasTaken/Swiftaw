-- ══════════════════════════════════════════════════════════════
--   SWIFTAW · Supabase setup
--   Project: mwszvynzzugbowdngzab.supabase.co
--
--   Run this whole file once in the Supabase SQL editor
--   (Dashboard → SQL Editor → New query → paste → Run).
--   It's safe to re-run: everything uses IF NOT EXISTS / OR REPLACE.
--
--   It sets up three things:
--     1. profiles        — a Swiftaw account row per auth user
--     2. lifecheck_keys  — each user's Lifecheck API key pairs
--     3. swiftaw_reactions — the live reaction counter used on the site
--
--   TIP: for instant sign-up (no email confirmation step) on the API
--   keys page, go to Authentication → Providers → Email and turn OFF
--   "Confirm email". Leave it ON if you want verified emails.
-- ══════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════
-- 1. PROFILES  (Swiftaw accounts)
-- ════════════════════════════════════════════
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  username     text unique,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- add avatar_url if you created this table before it existed
alter table public.profiles add column if not exists avatar_url text;

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;

-- Auto-create a profile row whenever someone signs up.
-- Username / avatar come from the sign-up metadata (options.data).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, avatar_url)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'username', ''),
    nullif(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Public username availability check for the sign-up form.
create or replace function public.username_available(u text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(u)
  );
$$;

grant execute on function public.username_available(text) to anon, authenticated;


-- ════════════════════════════════════════════
-- 1b. AVATARS  (Supabase Storage bucket for profile pictures)
-- ════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- anyone can view avatars; a user can only write files under their own uid/ folder
drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars: insert own" on storage.objects;
create policy "avatars: insert own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: update own" on storage.objects;
create policy "avatars: update own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: delete own" on storage.objects;
create policy "avatars: delete own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);


-- ════════════════════════════════════════════
-- 2. LIFECHECK API KEYS
--    One row per site key / secret key pair.
--    RLS: each user only ever sees and manages their own keys.
--    Your server verifies tokens with the SERVICE ROLE key, which
--    bypasses RLS to look up a secret_key.
-- ════════════════════════════════════════════
create table if not exists public.lifecheck_keys (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null default 'My site',
  site_key   text not null unique,
  secret_key text not null,
  domains    text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists lifecheck_keys_user_idx on public.lifecheck_keys(user_id);
create index if not exists lifecheck_keys_site_idx on public.lifecheck_keys(site_key);

alter table public.lifecheck_keys enable row level security;

drop policy if exists "keys: select own" on public.lifecheck_keys;
create policy "keys: select own"
  on public.lifecheck_keys for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "keys: insert own" on public.lifecheck_keys;
create policy "keys: insert own"
  on public.lifecheck_keys for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "keys: update own" on public.lifecheck_keys;
create policy "keys: update own"
  on public.lifecheck_keys for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "keys: delete own" on public.lifecheck_keys;
create policy "keys: delete own"
  on public.lifecheck_keys for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.lifecheck_keys to authenticated;


-- ════════════════════════════════════════════
-- 2b. LIFECHECK TOKENS  (server-issued verification tokens)
--     Makes keys "real": the widget asks Supabase to mint a token,
--     which only happens if the site key still exists (and the host
--     is allowed). Deleting a key stops new tokens immediately, and
--     the secret-side verify can no longer find the key. No page
--     reload needed for revocation to take effect.
-- ════════════════════════════════════════════
create table if not exists public.lifecheck_tokens (
  token      text primary key,
  key_id     uuid not null references public.lifecheck_keys(id) on delete cascade,
  site_key   text not null,
  host       text,
  passed     text default 'challenge',
  used       boolean not null default false,
  used_at    timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 minutes')
);
create index if not exists lifecheck_tokens_key_idx on public.lifecheck_tokens(key_id);

alter table public.lifecheck_tokens enable row level security;
-- no direct table access; everything goes through the two RPCs below
revoke all on public.lifecheck_tokens from anon, authenticated;

-- Called by the widget (browser, anon key) after a human passes.
-- Returns a fresh token, or NULL if the site key is unknown/removed
-- or the host is not in the key's allow-list.
create or replace function public.lifecheck_issue_token(p_site_key text, p_host text, p_passed text default 'challenge')
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  k public.lifecheck_keys%rowtype;
  new_token text;
  host_ok boolean;
begin
  select * into k from public.lifecheck_keys where site_key = p_site_key limit 1;
  if not found then
    return null;                    -- key does not exist / was deleted
  end if;

  -- domain allow-list (empty = any domain). Matches exact host or subdomains.
  if array_length(k.domains, 1) is null then
    host_ok := true;
  else
    host_ok := exists (
      select 1 from unnest(k.domains) d
      where p_host = d or p_host like '%.' || d
    );
  end if;
  if not host_ok then
    return null;
  end if;

  new_token := 'LC1.1_' || replace(gen_random_uuid()::text, '-', '');
  insert into public.lifecheck_tokens (token, key_id, site_key, host, passed)
  values (new_token, k.id, p_site_key, p_host, coalesce(p_passed, 'challenge'));
  return new_token;
end;
$$;

-- Called by the customer's SERVER with their secret key + the token.
-- Consumes the token (single use) and returns a JSON verdict.
create or replace function public.lifecheck_verify_token(p_secret text, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  k public.lifecheck_keys%rowtype;
  t public.lifecheck_tokens%rowtype;
begin
  if p_secret is null or p_secret = '' then
    return jsonb_build_object('success', false, 'v', '1.1', 'error-codes', jsonb_build_array('missing-input-secret'));
  end if;
  select * into k from public.lifecheck_keys where secret_key = p_secret limit 1;
  if not found then
    return jsonb_build_object('success', false, 'v', '1.1', 'error-codes', jsonb_build_array('invalid-input-secret'));
  end if;
  if p_token is null or p_token = '' then
    return jsonb_build_object('success', false, 'v', '1.1', 'error-codes', jsonb_build_array('missing-input-token'));
  end if;

  select * into t from public.lifecheck_tokens where token = p_token and key_id = k.id limit 1;
  if not found then
    return jsonb_build_object('success', false, 'v', '1.1', 'error-codes', jsonb_build_array('invalid-input-token'));
  end if;
  if t.used or t.expires_at < now() then
    return jsonb_build_object('success', false, 'v', '1.1', 'error-codes', jsonb_build_array('timeout-or-duplicate'));
  end if;

  update public.lifecheck_tokens set used = true, used_at = now() where token = t.token;

  return jsonb_build_object(
    'success', true,
    'score', 0.9,
    'passed', t.passed,
    'challenge_ts', t.created_at,
    'hostname', t.host,
    'v', '1.1',
    'error-codes', jsonb_build_array()
  );
end;
$$;

grant execute on function public.lifecheck_issue_token(text, text, text) to anon, authenticated;
grant execute on function public.lifecheck_verify_token(text, text) to anon, authenticated;


-- ════════════════════════════════════════════
-- 3. REACTIONS  (live counter used across swiftaw.com)
--    Matches what /css/swiftaw.js expects: a swiftaw_reactions
--    table plus swiftaw_inc_reaction / swiftaw_dec_reaction RPCs.
-- ════════════════════════════════════════════
create table if not exists public.swiftaw_reactions (
  key   text primary key,
  count integer not null default 0
);

-- Seed the 133 starting reactions (53 + 37 + 43). Won't overwrite on re-run.
insert into public.swiftaw_reactions (key, count) values
  ('stoked', 53),
  ('stunned', 37),
  ('loved',  43)
on conflict (key) do nothing;

-- RPCs the client calls. SECURITY DEFINER so anon can run them
-- without direct write access to the table.
create or replace function public.swiftaw_inc_reaction(k text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if k not in ('stoked','stunned','loved') then return; end if;
  update public.swiftaw_reactions set count = count + 1 where key = k;
end;
$$;

create or replace function public.swiftaw_dec_reaction(k text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if k not in ('stoked','stunned','loved') then return; end if;
  update public.swiftaw_reactions
    set count = greatest(count - 1, 0)
    where key = k;
end;
$$;

grant select on public.swiftaw_reactions to anon, authenticated;
grant execute on function public.swiftaw_inc_reaction(text) to anon, authenticated;
grant execute on function public.swiftaw_dec_reaction(text) to anon, authenticated;

alter table public.swiftaw_reactions enable row level security;

drop policy if exists "reactions: public read" on public.swiftaw_reactions;
create policy "reactions: public read"
  on public.swiftaw_reactions for select
  to anon, authenticated
  using (true);

-- Realtime broadcast so reactions update live across tabs/devices.
-- (Ignore the error if the table is already in the publication.)
do $$
begin
  alter publication supabase_realtime add table public.swiftaw_reactions;
exception when duplicate_object then null;
end $$;

-- ══════════════════════════════════════════════════════════════
--   Done. Publishable (anon) key used by the site:
--     sb_publishable_dqsqX2klo1j4xSyEFA7O1w_UjM8lEGf
--   Keep your SERVICE ROLE key server-side only (never in the browser).
-- ══════════════════════════════════════════════════════════════
