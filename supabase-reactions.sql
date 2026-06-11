-- ════════════════════════════════════════════
--   Swiftaw reactions - real-time counter
--   Run this once in your Supabase SQL editor.
--   (If you ran an older version where counts looked stuck at the seed,
--   re-run this file - it adds the RLS bits the old version missed.)
-- ════════════════════════════════════════════

create table if not exists public.swiftaw_reactions (
  key   text primary key,
  count integer not null default 0
);

-- Seed the 133 fake reactions (53 + 37 + 43). Won't overwrite if you re-run.
insert into public.swiftaw_reactions (key, count) values
  ('stoked', 53),
  ('stunned', 37),
  ('loved',  43)
on conflict (key) do nothing;

-- RPCs the client calls. SECURITY DEFINER so anon can run them
-- without needing direct write access to the table.
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

-- Public access
grant usage on schema public to anon;
grant select on public.swiftaw_reactions to anon;
grant execute on function public.swiftaw_inc_reaction(text) to anon;
grant execute on function public.swiftaw_dec_reaction(text) to anon;

-- ════════════════════════════════════════════
-- Row Level Security: Supabase enables RLS by default on new tables.
-- Without a SELECT policy, anon gets an empty array back and the widget
-- silently shows the seed numbers instead of the real ones.
-- Enable RLS explicitly and add a policy that lets anyone read counts.
-- ════════════════════════════════════════════
alter table public.swiftaw_reactions enable row level security;

drop policy if exists "anon can read reactions" on public.swiftaw_reactions;
create policy "anon can read reactions"
  on public.swiftaw_reactions
  for select
  to anon, authenticated
  using (true);

-- Realtime broadcast (so other tabs/devices update live)
alter publication supabase_realtime add table public.swiftaw_reactions;
