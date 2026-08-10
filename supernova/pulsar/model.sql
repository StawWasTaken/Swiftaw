-- ════════════════════════════════════════════════════════════════
--  PULSAR — the model itself: TRAIN + GENERATE, as pure SQL functions.
--  Run this in the AI project's SQL Editor AFTER schema.sql.
--  No terminal, no Edge Functions: the website calls these directly.
--
--  This is Pulsar's own brain. It learns word patterns from the data it
--  stocked (chats + corpus, weighted by feedback) into pulsar_ngrams, and
--  generates new sentences by walking those learned patterns. A real (if
--  simple) statistical language model — not another company's model.
-- ════════════════════════════════════════════════════════════════

-- track what's already been learned
alter table pulsar_messages add column if not exists trained boolean not null default false;
alter table pulsar_corpus   add column if not exists trained boolean not null default false;
-- richer feedback: a rating (thumbs) OR a written note from Swiftaw
alter table pulsar_feedback  add column if not exists note text;
alter table pulsar_feedback  alter column rating drop not null;

-- ── TRAIN: learn n-grams from the data, weighted by feedback ───────
--  rebuild = false (default): fast incremental pass over NEW rows only.
--  rebuild = true: full retrain. Relearns from ALL chats + corpus it has
--  ever seen (reinforcing already-learned vocab + patterns), rebuilding the
--  counts from scratch so nothing gets double-counted. Use this to sharpen.
drop function if exists pulsar_train(text, int);
create or replace function pulsar_train(admin_uid text default null, batch int default 800, rebuild boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_processed int := 0;
begin
  if admin_uid is not null and not exists (select 1 from pulsar_trusted_accounts where user_id = admin_uid)
    then raise exception 'not authorised to train pulsar';
  end if;

  if rebuild then
    -- start the learned vocab + patterns fresh, then relearn from EVERYTHING
    delete from pulsar_vocab;
    delete from pulsar_ngrams;
    create temp table _batch on commit drop as
      select id, content as body,
             (case when feedback = 'up' then 3 when feedback = 'down' then 0 else 1 end) as w
      from pulsar_messages
      where content <> '' and role in ('user','assistant');
    insert into _batch(id, body, w)
      select id, text, greatest(1, round(trust * 2))::int
      from pulsar_corpus where text <> '';
  else
    create temp table _batch on commit drop as
      select id, content as body,
             (case when feedback = 'up' then 3 when feedback = 'down' then 0 else 1 end) as w
      from pulsar_messages
      where trained = false and content <> '' and role in ('user','assistant')
      order by created_at asc limit batch;
    insert into _batch(id, body, w)
      select id, text, greatest(1, round(trust * 2))::int
      from pulsar_corpus where trained = false and text <> '' limit batch;
  end if;

  select count(*) into v_processed from _batch where w > 0;

  create temp table _toks on commit drop as
    select b.id, b.w, x.ord, x.tok
    from _batch b
    cross join lateral (
      select tok, ord from unnest(
        regexp_split_to_array(regexp_replace(lower(b.body), '([.,!?;:()"])', ' \1 ', 'g'), '\s+')
      ) with ordinality as u(tok, ord)
      where tok <> ''
    ) x
    where b.w > 0;

  insert into pulsar_vocab(token, freq)
    select tok, sum(w)::bigint from _toks group by tok
  on conflict (token) do update set freq = pulsar_vocab.freq + excluded.freq;

  insert into pulsar_ngrams(n, context, next_token, freq)
    select 2, a.tok, b.tok, sum(a.w)::bigint
    from _toks a join _toks b on a.id = b.id and b.ord = a.ord + 1
    group by a.tok, b.tok
  on conflict (n, context, next_token) do update set freq = pulsar_ngrams.freq + excluded.freq;

  insert into pulsar_ngrams(n, context, next_token, freq)
    select 3, a.tok || ' ' || b.tok, c.tok, sum(a.w)::bigint
    from _toks a
    join _toks b on a.id = b.id and b.ord = a.ord + 1
    join _toks c on a.id = c.id and c.ord = a.ord + 2
    group by a.tok, b.tok, c.tok
  on conflict (n, context, next_token) do update set freq = pulsar_ngrams.freq + excluded.freq;

  update pulsar_messages set trained = true where id in (select id from _batch);
  update pulsar_corpus  set trained = true where id in (select id from _batch);

  insert into pulsar_model_state(key, value)
    values ('train', jsonb_build_object('last_trained', now()::text))
  on conflict (key) do update set value = jsonb_build_object('last_trained', now()::text), updated_at = now();

  return jsonb_build_object('processed', v_processed,
    'vocab', (select count(*) from pulsar_vocab),
    'ngrams', (select count(*) from pulsar_ngrams));
end $$;

-- ── GENERATE: walk the learned patterns to produce a sentence ──────
create or replace function pulsar_generate(seed text default '', max_tokens int default 60)
returns text language plpgsql security definer set search_path = public as $$
declare
  seedtoks text[]; out text[] := '{}'; ctx text[]; nxt text; i int := 0; l1 text; l2 text;
begin
  seedtoks := array_remove(regexp_split_to_array(lower(coalesce(seed,'')), '\s+'), '');
  loop
    exit when i >= max_tokens;
    ctx := seedtoks || out;
    l1 := ctx[array_length(ctx,1)];
    l2 := ctx[array_length(ctx,1) - 1];
    nxt := null;
    if l1 is not null and l2 is not null then
      select next_token into nxt from pulsar_ngrams
        where n = 3 and context = l2 || ' ' || l1 order by freq * random() desc limit 1;
    end if;
    if nxt is null and l1 is not null then
      select next_token into nxt from pulsar_ngrams
        where n = 2 and context = l1 order by freq * random() desc limit 1;
    end if;
    if nxt is null then
      select token into nxt from pulsar_vocab
        where token !~ '^[.,!?;:()"]$' order by freq * random() desc limit 1;
    end if;
    exit when nxt is null;
    out := array_append(out, nxt);
    i := i + 1;
    exit when nxt in ('.', '!', '?') and i > 10;
  end loop;
  return trim(regexp_replace(array_to_string(out, ' '), '\s+([.,!?;:])', '\1', 'g'));
end $$;

-- ── STATS: safe counts for the Trainer UI (no raw data) ────────────
create or replace function pulsar_stats()
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'messages', (select count(*) from pulsar_messages),
    'untrained', (select count(*) from pulsar_messages where trained = false),
    'corpus', (select count(*) from pulsar_corpus),
    'vocab', (select count(*) from pulsar_vocab),
    'ngrams', (select count(*) from pulsar_ngrams),
    'signals', (select count(*) from pulsar_signals),
    'last_trained', (select value->>'last_trained' from pulsar_model_state where key = 'train')
  );
$$;

-- ── FEEDBACK NOTE: Swiftaw's written guidance (high-signal) ────────
create or replace function pulsar_feedback_note(admin_uid text, note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from pulsar_trusted_accounts where user_id = admin_uid)
    then raise exception 'only Swiftaw can leave a feedback note';
  end if;
  insert into pulsar_feedback(user_ref, model, note, rating) values (admin_uid, 'pulsar', note, null);
  insert into pulsar_facts(statement, trust, source_type, asserted_by)
    values ('Improvement directive from Swiftaw: ' || note, 1.0, 'swiftaw', admin_uid);
end $$;

-- the website calls these with the publishable (anon) key
grant execute on function pulsar_generate(text, int)      to anon, authenticated;
grant execute on function pulsar_stats()                  to anon, authenticated;
grant execute on function pulsar_train(text, int, boolean) to anon, authenticated;
grant execute on function pulsar_feedback_note(text, text) to anon, authenticated;
