-- ════════════════════════════════════════════════════════════════
--  Import Lifecheck session-summaries into Pulsar — NO terminal needed.
--  Runs entirely in the AI project's SQL Editor (same place as schema.sql).
--  It calls the Lifecheck REST API from inside Postgres via the `http`
--  extension, so no CSV, no Node, no service files.
--
--  Before running: paste your LIFECHECK service_role key on the marked line
--  (Lifecheck project -> Settings -> API -> service_role -> Reveal -> copy).
--  Run schema.sql first (needs the pulsar_signals table).
-- ════════════════════════════════════════════════════════════════

create extension if not exists http with schema extensions;

do $$
declare
  lc_key text := 'PASTE_LIFECHECK_SERVICE_ROLE_KEY';   -- <== only thing you edit
  api    text := 'https://mwszvynzzugbowdngzab.supabase.co/rest/v1/lifecheck_events'
                 || '?select=*&event=eq.session_summary&order=id.asc';
  off    int  := 0;
  pagesz int  := 1000;
  body   jsonb;
  got    int;
begin
  loop
    select (r.content)::jsonb into body
    from http((
      'GET',
      api || '&limit=' || pagesz || '&offset=' || off,
      array[ http_header('apikey', lc_key), http_header('Authorization', 'Bearer ' || lc_key) ],
      NULL, NULL
    )::http_request) as r;

    got := jsonb_array_length(coalesce(body, '[]'::jsonb));
    exit when got = 0;

    insert into pulsar_signals (source, session_key, label, features)
    select 'lifecheck',
           coalesce(e->>'session_id', e->>'id', gen_random_uuid()::text),
           null,
           coalesce(e->'data', e->'payload', e)
    from jsonb_array_elements(body) as e
    on conflict (source, session_key) do nothing;

    off := off + pagesz;
    exit when got < pagesz;
  end loop;

  raise notice 'Lifecheck import complete.';
end $$;

-- did it work?
select count(*) as pulsar_signals from pulsar_signals;
