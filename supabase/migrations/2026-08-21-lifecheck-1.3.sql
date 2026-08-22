-- ════════════════════════════════════════════════════════════
--  Lifecheck v1.3
--
--  Run this once in the Supabase SQL editor. It is safe to re-run.
--
--  Two things change on the server side this release:
--
--  1. The score stops being a lie. `lifecheck_verify_token` has always
--     returned `"score": 0.9` — a constant, for every token ever issued,
--     regardless of what the widget actually saw. v1.3's widget computes a
--     real 0..1 human-confidence score from nine signals, so the token now
--     carries it and verification hands it back. Anyone already gating on
--     `success` is unaffected; anyone who wants a softer gate (hold for
--     review under 0.6, say) finally has something real to gate on.
--
--  2. Tokens record how they were earned — passive signals, a solved
--     challenge, or an invisible-mode check — so `passed` and `mode` can be
--     told apart in the data instead of being inferred.
--
--  Nothing here touches the domain allow-list or the keys table. Reserved
--  preview keys (anything ending in `_public`) never reach the server at
--  all: the widget mints those locally and labels them `LC1.3-preview_…`,
--  and `lifecheck_verify_token` rejects them like any unknown token.
-- ════════════════════════════════════════════════════════════

-- ── Part 1: carry the score and the mode on the token ──
alter table public.lifecheck_tokens
  add column if not exists score numeric(4,3),
  add column if not exists mode  text;

-- ── Part 2: issue a token with the widget's score ──
-- The old three-argument function has to go rather than being left beside
-- this one: two overloads that differ only by a defaulted argument make the
-- call ambiguous over PostgREST, and every request would start failing.
drop function if exists public.lifecheck_issue_token(text, text, text);

create or replace function public.lifecheck_issue_token(
  p_site_key text,
  p_host     text,
  p_passed   text default 'challenge',
  p_score    numeric default null,
  p_mode     text default null
)
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

  new_token := 'LC1.3_' || replace(gen_random_uuid()::text, '-', '');
  insert into public.lifecheck_tokens (token, key_id, site_key, host, passed, score, mode)
  values (
    new_token, k.id, p_site_key, p_host,
    coalesce(p_passed, 'challenge'),
    -- clamp: the score arrives from a browser, so don't store whatever it says
    case when p_score is null then null
         else greatest(0::numeric, least(1::numeric, p_score)) end,
    left(coalesce(p_mode, ''), 16)
  );
  return new_token;
end;
$$;

grant execute on function public.lifecheck_issue_token(text, text, text, numeric, text) to anon, authenticated;

-- ── Part 3: return the real score on verification ──
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
    return jsonb_build_object('success', false, 'v', '1.3', 'error-codes', jsonb_build_array('missing-input-secret'));
  end if;
  select * into k from public.lifecheck_keys where secret_key = p_secret limit 1;
  if not found then
    return jsonb_build_object('success', false, 'v', '1.3', 'error-codes', jsonb_build_array('invalid-input-secret'));
  end if;
  if p_token is null or p_token = '' then
    return jsonb_build_object('success', false, 'v', '1.3', 'error-codes', jsonb_build_array('missing-input-token'));
  end if;

  select * into t from public.lifecheck_tokens where token = p_token and key_id = k.id limit 1;
  if not found then
    return jsonb_build_object('success', false, 'v', '1.3', 'error-codes', jsonb_build_array('invalid-input-token'));
  end if;
  if t.used or t.expires_at < now() then
    return jsonb_build_object('success', false, 'v', '1.3', 'error-codes', jsonb_build_array('timeout-or-duplicate'));
  end if;

  update public.lifecheck_tokens set used = true, used_at = now() where token = t.token;

  return jsonb_build_object(
    'success', true,
    -- tokens minted before this migration have no score; 0.9 is what the old
    -- endpoint always claimed, so old rows keep answering exactly as before
    'score', coalesce(t.score, 0.9),
    'passed', t.passed,
    'mode', coalesce(t.mode, 'checkbox'),
    'challenge_ts', t.created_at,
    'hostname', t.host,
    'v', '1.3',
    'error-codes', jsonb_build_array()
  );
end;
$$;

grant execute on function public.lifecheck_verify_token(text, text) to anon, authenticated;

-- ── Part 4: cap the size of a single telemetry detail blob ──
-- Every other field lifecheck_log_events writes is length-capped; `detail`
-- was not, which left an anonymous endpoint that would store an arbitrarily
-- large blob. v1.3's demo_trace rows are the biggest legitimate payload and
-- land well under 16 KB.
create or replace function public.lifecheck_log_events(
  p_events   jsonb,
  p_site_key text default null,
  p_host     text default null,
  p_session  text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  e jsonb;
  n int;
  i int;
begin
  if p_events is null or jsonb_typeof(p_events) <> 'array' then
    return;
  end if;
  n := jsonb_array_length(p_events);
  if n > 50 then n := 50; end if;   -- cap batch size
  i := 0;
  while i < n loop
    e := p_events -> i;
    if jsonb_typeof(e) = 'object' then
      insert into public.lifecheck_events
        (session_id, site_key, host, event_type, challenge, outcome, suspicious, detail)
      values (
        left(coalesce(p_session, ''), 64),
        left(coalesce(p_site_key, ''), 128),
        left(coalesce(p_host, ''), 255),
        left(coalesce(e ->> 't', 'unknown'), 48),
        left(coalesce(e ->> 'challenge', ''), 32),
        left(coalesce(e ->> 'outcome', ''), 16),
        coalesce((e ->> 'suspicious')::boolean, false),
        case when length(coalesce(e -> 'detail', '{}'::jsonb)::text) > 16384
             then jsonb_build_object('dropped', 'detail-too-large')
             else coalesce(e -> 'detail', '{}'::jsonb) end
      );
    end if;
    i := i + 1;
  end loop;
end;
$$;

grant execute on function public.lifecheck_log_events(jsonb, text, text, text) to anon, authenticated;

-- ── Part 5: nothing to change for events, but worth knowing ──
-- v1.3 adds a `demo_trace` event type to lifecheck_events. Its `detail` is a
-- self-describing record of one solved (or failed) mini-game:
--
--   { schema:"lc-demo-1", game:"imagepick", solved:true, solveMs:2140,
--     state:  { kind:"pick-one", prompt:"click the frog", answer:[4],
--               tiles:[{ i:0, label:"bee", life:true, box:[x,y,w,h] }, …] },
--     actions:[{ k:"tap", t:812, at:[.31,.44], on:[.52,.48], i:4,
--                label:"frog", correct:true }, …],
--     path:   { x:[…], y:[…], t:[…] } }
--
-- Boxes and coordinates are 0..1 fractions of the challenge area, so the rows
-- are resolution- and layout-independent. Observation → action → outcome:
-- the shape you'd train a behaviour-cloning policy on.
--
--   select detail from public.lifecheck_events
--   where event_type = 'demo_trace' and detail->>'solved' = 'true';
--
-- Check the result of this migration:
--   select token, passed, mode, score from public.lifecheck_tokens
--   order by created_at desc limit 10;
