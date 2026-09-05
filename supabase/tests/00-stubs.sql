-- Enough of Supabase to load Swiftaw's schema locally. Not a reimplementation:
-- auth.uid() reads a session setting so a test can say who it is acting as.
create schema if not exists auth;
create extension if not exists pgcrypto;

create table if not exists auth.users (
  id         uuid primary key default gen_random_uuid(),
  email      text,
  created_at timestamptz not null default now()
);

create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('swiftaw.uid', true), '')::uuid;
$$;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;

-- The account table the icon service reads for its username fallback. This is
-- the shape from swiftaw-supabase-setup.sql, cut to the columns used here.
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  username     text unique,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

grant usage on schema public to anon, authenticated;
