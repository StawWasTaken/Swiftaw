-- ════════════════════════════════════════════
--   Swiftaw reactions - real-time counter
--   Run this once in your Supabase SQL editor.
--   Then plug SUPABASE_URL + SUPABASE_ANON_KEY
--   into the <script> at the bottom of each page
--   that uses the reactions widget.
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

-- Realtime broadcast (so other tabs/devices update live)
alter publication supabase_realtime add table public.swiftaw_reactions;
