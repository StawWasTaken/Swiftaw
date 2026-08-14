-- ════════════════════════════════════════════════════════════
--  Lifecheck · normalise the domain allow-list
--
--  Run this once in the Supabase SQL editor.
--
--  The allow-list is compared against the embedding page's
--  location.hostname, which is always a bare hostname ("fortized.com").
--  The keys dashboard stored whatever was typed, so a domain entered as a
--  full URL ("https://fortized.com") matched nothing and the key was
--  rejected on every request — indistinguishable, from the widget, from a
--  key that doesn't exist.
--
--  Part 1 normalises entries at match time, so existing keys start working
--  without anyone re-typing them. Part 2 cleans the stored rows so the
--  dashboard shows what is actually being matched.
-- ════════════════════════════════════════════════════════════

-- ── Part 1: match on normalised hostnames ──
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

  -- Domain allow-list (empty = any domain). Matches exact host or subdomains.
  -- p_host is the embedding page's location.hostname, so allow-list entries
  -- are normalised to bare hostnames before comparing: entries pasted as full
  -- URLs ("https://example.com/") used to match nothing and silently reject
  -- every request, with no way to tell that from a wrong key.
  if array_length(k.domains, 1) is null then
    host_ok := true;
  else
    host_ok := exists (
      select 1 from unnest(k.domains) d
      cross join lateral (
        select split_part(
                 split_part(
                   regexp_replace(lower(trim(d)), '^[a-z][a-z0-9+.-]*://', ''),
                 '/', 1),
               ':', 1) as nd
      ) n
      where n.nd <> ''
        and (lower(p_host) = n.nd or lower(p_host) like '%.' || n.nd)
    );
  end if;
  if not host_ok then
    return null;
  end if;

  new_token := 'LC1.2_' || replace(gen_random_uuid()::text, '-', '');
  insert into public.lifecheck_tokens (token, key_id, site_key, host, passed)
  values (new_token, k.id, p_site_key, p_host, coalesce(p_passed, 'challenge'));
  return new_token;
end;
$$;

grant execute on function public.lifecheck_issue_token(text, text, text) to anon, authenticated;


-- ── Part 2: clean up existing rows ──
-- Strips scheme, port, path and trailing dots; lowercases; drops empties.
update public.lifecheck_keys
set domains = coalesce((
  select array_agg(nd)
  from (
    select distinct rtrim(
             split_part(
               split_part(
                 regexp_replace(lower(trim(d)), '^[a-z][a-z0-9+.-]*://', ''),
               '/', 1),
             ':', 1), '.') as nd
    from unnest(domains) d
  ) s
  where nd <> ''
), '{}')
where exists (
  select 1 from unnest(domains) d
  where trim(d) <> rtrim(split_part(split_part(
          regexp_replace(lower(trim(d)), '^[a-z][a-z0-9+.-]*://', ''),
        '/', 1), ':', 1), '.')
);

-- Check the result:
--   select name, domains from public.lifecheck_keys;
