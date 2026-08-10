-- ============================================================
-- SUPERNOVA: cross-device chat sync
-- Stores each account's chats + folders so they follow the user
-- across browsers and devices instead of living in one browser.
--
-- Privacy: no direct table access is granted. Reads/writes go through
-- two SECURITY DEFINER functions that only ever touch the row for the
-- user_id you pass, so nobody can list everyone's chats.
--
-- Run this once in the AI project's Supabase SQL editor
-- (project xrmmedxbqmwjcucyjosl).
-- ============================================================

create table if not exists public.sn_chats (
  user_id    text primary key,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.sn_chats enable row level security;

-- lock the table down: only the functions below may read/write it
revoke all on public.sn_chats from anon, authenticated;

create or replace function public.sn_chats_get(uid text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select data from public.sn_chats where user_id = uid;
$$;

create or replace function public.sn_chats_put(uid text, payload jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.sn_chats (user_id, data, updated_at)
  values (uid, payload, now())
  on conflict (user_id) do update
    set data = excluded.data, updated_at = now();
$$;

grant execute on function public.sn_chats_get(text)        to anon, authenticated;
grant execute on function public.sn_chats_put(text, jsonb) to anon, authenticated;
