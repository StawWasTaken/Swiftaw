-- ════════════════════════════════════════════════════════════════
--  PULSAR — feedback-learns-sentences + neural-model support.
--  Run in the AI project SQL editor AFTER schema.sql and model.sql.
-- ════════════════════════════════════════════════════════════════

-- learned example sentences (Pulsar's "sentence vocabulary")
create table if not exists pulsar_sentences (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  source text not null default 'swiftaw',
  trust real not null default 1.0,
  created_at timestamptz not null default now()
);
alter table pulsar_sentences enable row level security;
drop policy if exists sent_read on pulsar_sentences;
create policy sent_read on pulsar_sentences for select using (true);   -- browser reads these to vary its phrasing

-- Feedback that TEACHES sentences. Any text Swiftaw puts in quotes
-- ("..." / "...") is added to Pulsar's sentence vocabulary AND its corpus,
-- so training learns those exact phrasings and can recombine them.
-- (model.sql made this return void; we change it to jsonb, so drop first.)
drop function if exists pulsar_feedback_note(text, text);
create or replace function pulsar_feedback_note(admin_uid text, note text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare q text; cnt int := 0;
begin
  if not exists (select 1 from pulsar_trusted_accounts where user_id = admin_uid)
    then raise exception 'only Swiftaw can leave a feedback note';
  end if;
  insert into pulsar_feedback(user_ref, model, note, rating) values (admin_uid, 'pulsar', note, null);
  insert into pulsar_facts(statement, trust, source_type, asserted_by)
    values ('Directive from Swiftaw: ' || note, 1.0, 'swiftaw', admin_uid);

  -- every quoted string is learned three ways: as a phrasing example, as
  -- corpus to train on, and as a trusted FACT Pulsar can recall later.
  for q in select (m)[1] from regexp_matches(note, '["""]([^"""]{3,})["""]', 'g') as m loop
    insert into pulsar_sentences(text, source, trust) values (btrim(q), 'swiftaw', 1.0);
    insert into pulsar_corpus(text, source, trust)   values (btrim(q), 'swiftaw', 1.0);
    insert into pulsar_facts(statement, trust, source_type, asserted_by)
      values (btrim(q), 1.0, 'swiftaw', admin_uid);
    cnt := cnt + 1;
  end loop;

  return jsonb_build_object('sentences_learned', cnt);
end $$;
grant execute on function pulsar_feedback_note(text, text) to anon, authenticated;

-- RECALL: given a question, return the best-matching trusted fact (or null).
-- This is how "is elon musk the richest man?" finds the fact Swiftaw taught.
create or replace function pulsar_recall(query text)
returns text language plpgsql security definer set search_path = public as $$
declare best text; sc int;
begin
  select statement,
    (select count(*) from unnest(regexp_split_to_array(lower(query), '\s+')) w
       where length(w) > 3 and lower(pulsar_facts.statement) like '%' || w || '%')
  into best, sc
  from pulsar_facts
  where trust >= 0.9 and source_type <> 'model'
  order by 2 desc, created_at desc
  limit 1;
  if sc is null or sc < 2 then return null; end if;
  return best;
end $$;
grant execute on function pulsar_recall(text) to anon, authenticated;

-- Generator upgrade: when there's no seed, start from a learned sentence's
-- opening sometimes, then continue with its own n-grams -> its own sentences,
-- built from its words + sentence vocabulary, with variety.
create or replace function pulsar_generate(seed text default '', max_tokens int default 60)
returns text language plpgsql security definer set search_path = public as $$
declare seedtoks text[]; out text[] := '{}'; ctx text[]; nxt text; i int := 0; l1 text; l2 text; s text;
begin
  seedtoks := array_remove(regexp_split_to_array(lower(coalesce(seed,'')), '\s+'), '');
  if array_length(seedtoks,1) is null and random() < 0.6 then
    select text into s from pulsar_sentences order by trust * random() desc limit 1;
    if s is not null then
      seedtoks := (array_remove(regexp_split_to_array(lower(regexp_replace(s,'([.,!?;:()"])',' \1 ','g')), '\s+'), ''))[1:2];
    end if;
  end if;
  loop
    exit when i >= max_tokens;
    ctx := seedtoks || out;
    l1 := ctx[array_length(ctx,1)]; l2 := ctx[array_length(ctx,1) - 1]; nxt := null;
    if l1 is not null and l2 is not null then
      select next_token into nxt from pulsar_ngrams where n = 3 and context = l2 || ' ' || l1 order by freq * random() desc limit 1;
    end if;
    if nxt is null and l1 is not null then
      select next_token into nxt from pulsar_ngrams where n = 2 and context = l1 order by freq * random() desc limit 1;
    end if;
    if nxt is null then
      select token into nxt from pulsar_vocab where token !~ '^[.,!?;:()"]$' order by freq * random() desc limit 1;
    end if;
    exit when nxt is null;
    out := array_append(out, nxt); i := i + 1;
    exit when nxt in ('.', '!', '?') and i > 8;
  end loop;
  return trim(regexp_replace(array_to_string(seedtoks || out, ' '), '\s+([.,!?;:])', '\1', 'g'));
end $$;
grant execute on function pulsar_generate(text, int) to anon, authenticated;

-- Export text for the NEURAL trainer (Swiftaw browser pulls this to train TF.js)
create or replace function pulsar_export(admin_uid text, lim int default 5000)
returns text[] language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from pulsar_trusted_accounts where user_id = admin_uid)
    then raise exception 'not authorised to export';
  end if;
  return array(
    select content from pulsar_messages where content <> '' order by created_at desc limit lim
    union all select text from pulsar_corpus    where text <> ''
    union all select text from pulsar_sentences
  );
end $$;
grant execute on function pulsar_export(text, int) to anon, authenticated;

-- Storage bucket to hold the trained neural model (public read; the Swiftaw
-- browser uploads model.json + weights.bin + vocab.json here).
insert into storage.buckets (id, name, public) values ('pulsar', 'pulsar', true)
  on conflict (id) do nothing;
drop policy if exists "pulsar read"   on storage.objects;
drop policy if exists "pulsar write"  on storage.objects;
drop policy if exists "pulsar update" on storage.objects;
create policy "pulsar read"   on storage.objects for select using (bucket_id = 'pulsar');
create policy "pulsar write"  on storage.objects for insert with check (bucket_id = 'pulsar');
create policy "pulsar update" on storage.objects for update using (bucket_id = 'pulsar') with check (bucket_id = 'pulsar');
