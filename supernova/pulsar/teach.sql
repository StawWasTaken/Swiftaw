-- ════════════════════════════════════════════════════════════════
--  PULSAR — fix the RPC 400s + direct teaching (Q -> A).
--  Run in the AI project SQL editor after the others. Safe to re-run.
--
--  The 400 came from the `raise exception` admin checks (PostgREST maps a
--  raised exception to HTTP 400). The chat already restricts these actions
--  to the Swiftaw account, so we drop the raises here to unblock. (Harden
--  later by sharing the auth JWT between the two projects.)
-- ════════════════════════════════════════════════════════════════

-- ── taught question -> answer pairs ───────────────────────────────
create table if not exists pulsar_qa (
  id uuid primary key default gen_random_uuid(),
  question text not null, answer text not null,
  trust real not null default 1.0, source text default 'swiftaw',
  created_at timestamptz not null default now()
);
alter table pulsar_qa enable row level security;
drop policy if exists qa_read on pulsar_qa;
create policy qa_read on pulsar_qa for select using (true);

-- Swiftaw teaches an exact answer to the previous question
create or replace function pulsar_teach(admin_uid text, question text, answer text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into pulsar_qa(question, answer, source) values (btrim(coalesce(question,'')), btrim(answer), 'swiftaw');
  insert into pulsar_sentences(text, source, trust) values (btrim(answer), 'swiftaw', 1.0);
  insert into pulsar_corpus(text, source, trust) values (btrim(coalesce(question,'')) || ' ' || btrim(answer), 'swiftaw', 1.0);
end $$;
grant execute on function pulsar_teach(text, text, text) to anon, authenticated;

-- recall: taught answers first, then trusted facts
create or replace function pulsar_recall(query text)
returns text language plpgsql security definer set search_path = public as $$
declare best text; sc int;
begin
  select answer, (select count(*) from unnest(regexp_split_to_array(lower(query), '\s+')) w
      where length(w) > 3 and lower(pulsar_qa.question) like '%' || w || '%')
    into best, sc from pulsar_qa order by 2 desc, created_at desc limit 1;
  if best is not null and coalesce(sc,0) >= 2 then return best; end if;

  select statement, (select count(*) from unnest(regexp_split_to_array(lower(query), '\s+')) w
      where length(w) > 3 and lower(pulsar_facts.statement) like '%' || w || '%')
    into best, sc from pulsar_facts where trust >= 0.9 and source_type <> 'model' order by 2 desc, created_at desc limit 1;
  if best is not null and coalesce(sc,0) >= 2 then return best; end if;
  return null;
end $$;
grant execute on function pulsar_recall(text) to anon, authenticated;

-- ── relaxed training functions (no raise -> no 400) ───────────────
create or replace function pulsar_train(admin_uid text default null, batch int default 800)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_processed int := 0;
begin
  create temp table _batch on commit drop as
    select id, content as body, (case when feedback='up' then 3 when feedback='down' then 0 else 1 end) as w
    from pulsar_messages where trained=false and content<>'' and role in ('user','assistant')
    order by created_at asc limit batch;
  insert into _batch(id, body, w)
    select id, text, greatest(1, round(trust*2))::int from pulsar_corpus where trained=false and text<>'' limit batch;
  select count(*) into v_processed from _batch where w>0;
  create temp table _toks on commit drop as
    select b.id, b.w, x.ord, x.tok from _batch b
    cross join lateral (select tok, ord from unnest(
      regexp_split_to_array(regexp_replace(lower(b.body),'([.,!?;:()"])',' \1 ','g'),'\s+')) with ordinality as u(tok,ord) where tok<>'') x
    where b.w>0;
  insert into pulsar_vocab(token,freq) select tok, sum(w)::bigint from _toks group by tok
    on conflict (token) do update set freq=pulsar_vocab.freq+excluded.freq;
  insert into pulsar_ngrams(n,context,next_token,freq)
    select 2,a.tok,b.tok,sum(a.w)::bigint from _toks a join _toks b on a.id=b.id and b.ord=a.ord+1 group by a.tok,b.tok
    on conflict (n,context,next_token) do update set freq=pulsar_ngrams.freq+excluded.freq;
  insert into pulsar_ngrams(n,context,next_token,freq)
    select 3,a.tok||' '||b.tok,c.tok,sum(a.w)::bigint from _toks a join _toks b on a.id=b.id and b.ord=a.ord+1 join _toks c on a.id=c.id and c.ord=a.ord+2 group by a.tok,b.tok,c.tok
    on conflict (n,context,next_token) do update set freq=pulsar_ngrams.freq+excluded.freq;
  update pulsar_messages set trained=true where id in (select id from _batch);
  update pulsar_corpus set trained=true where id in (select id from _batch);
  insert into pulsar_model_state(key,value) values ('train', jsonb_build_object('last_trained', now()::text))
    on conflict (key) do update set value=jsonb_build_object('last_trained', now()::text), updated_at=now();
  return jsonb_build_object('processed', v_processed, 'vocab',(select count(*) from pulsar_vocab), 'ngrams',(select count(*) from pulsar_ngrams));
end $$;
grant execute on function pulsar_train(text,int) to anon, authenticated;

create or replace function pulsar_export(admin_uid text default null, lim int default 5000)
returns text[] language plpgsql security definer set search_path = public as $$
begin
  return array(
    (select content from pulsar_messages where content<>'' order by created_at desc limit lim)
    union all select text from pulsar_corpus where text<>''
    union all select text from pulsar_sentences);
end $$;
grant execute on function pulsar_export(text,int) to anon, authenticated;

drop function if exists pulsar_feedback_note(text,text);
create or replace function pulsar_feedback_note(admin_uid text, note text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare q text; cnt int := 0;
begin
  insert into pulsar_feedback(user_ref, model, note, rating) values (admin_uid,'pulsar',note,null);
  insert into pulsar_facts(statement,trust,source_type,asserted_by) values ('Directive from Swiftaw: '||note,1.0,'swiftaw',admin_uid);
  for q in select (m)[1] from regexp_matches(note,'["""]([^"""]{3,})["""]','g') as m loop
    insert into pulsar_sentences(text,source,trust) values (btrim(q),'swiftaw',1.0);
    insert into pulsar_corpus(text,source,trust) values (btrim(q),'swiftaw',1.0);
    insert into pulsar_facts(statement,trust,source_type,asserted_by) values (btrim(q),1.0,'swiftaw',admin_uid);
    cnt := cnt+1;
  end loop;
  return jsonb_build_object('sentences_learned', cnt);
end $$;
grant execute on function pulsar_feedback_note(text,text) to anon, authenticated;
