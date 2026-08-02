-- ════════════════════════════════════════════════════════════════
--  PULSAR — Supernova's OWN model. Database (run in the AI Supabase
--  project: https://xrmmedxbqmwjcucyjosl.supabase.co).
--
--  This is our real AI's brain. It does NOT run another company's model
--  underneath. Pulsar learns from the data it stocks here (chats +
--  Lifecheck behaviour + the open web + Swiftaw ground truth) and
--  generates sentences from that data (an n-gram language model to start,
--  a neural one later). Nothing is trained until this schema exists.
--
--  Safe to run more than once (idempotent).
-- ════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── model registry ────────────────────────────────────────────────
create table if not exists pulsar_models (
  id text primary key, name text not null,
  status text not null default 'training',   -- training | preview | live
  created_at timestamptz not null default now()
);
insert into pulsar_models(id,name,status) values ('pulsar','Pulsar','training')
  on conflict (id) do nothing;

-- ── who Pulsar trusts 100% (the Swiftaw account = ground truth) ────
create table if not exists pulsar_trusted_accounts (
  user_id text primary key,      -- Swiftaw's auth user id (as text)
  username text not null, note text, added_at timestamptz not null default now()
);
create or replace function is_pulsar_admin() returns boolean language sql stable as $$
  select exists(select 1 from pulsar_trusted_accounts where user_id = auth.uid()::text);
$$;

-- ══ DATA STOCK (what Pulsar collects to learn from) ═══════════════

-- every chat turn (append-only training sink; the chat writes here)
create table if not exists pulsar_messages (
  id uuid primary key default gen_random_uuid(),
  conv_ref text, user_ref text,
  role text not null check (role in ('user','assistant','system')),
  content text not null default '',
  reasoning text, sources jsonb not null default '[]',
  feedback text check (feedback in ('up','down')),
  created_at timestamptz not null default now()
);
create index if not exists pulsar_messages_conv on pulsar_messages(conv_ref);

-- Lifecheck behaviour vectors, WITH a note on how Pulsar should use each
create table if not exists pulsar_signals (
  id bigint generated always as identity primary key,
  source text not null default 'lifecheck',
  session_key text, label text,          -- 'human' | 'bot' | null
  features jsonb not null,               -- durationMs, via, wrongTaps, cursor{...}, ...
  usage_note text default 'Human-vs-bot behaviour. Learn what real people look like; treat far-outliers as suspect. Never a fact about the world.',
  imported_at timestamptz not null default now(),
  unique (source, session_key)
);

-- facts, each with a trust level (1.0 = Swiftaw ground truth)
create table if not exists pulsar_facts (
  id uuid primary key default gen_random_uuid(),
  statement text not null,
  trust real not null default 0.5 check (trust between 0 and 1),
  source_type text not null default 'web',  -- web | swiftaw | chat | model
  source_url text, asserted_by text,
  created_at timestamptz not null default now()
);

-- raw web-search results Pulsar cited
create table if not exists pulsar_web_cache (
  id uuid primary key default gen_random_uuid(),
  query text not null, results jsonb not null default '[]',
  fetched_at timestamptz not null default now()
);

-- thumbs up/down kept even if a message is deleted (RLHF)
create table if not exists pulsar_feedback (
  id uuid primary key default gen_random_uuid(),
  user_ref text, model text not null default 'pulsar',
  prompt text, response text, rating text not null check (rating in ('up','down')),
  created_at timestamptz not null default now()
);

-- ══ THE GENERATIVE MODEL (Pulsar generates from THIS, its own data) ═
-- training documents (built from the stock above)
create table if not exists pulsar_corpus (
  id uuid primary key default gen_random_uuid(),
  text text not null, source text not null default 'chat',
  trust real not null default 0.5, created_at timestamptz not null default now()
);
-- vocabulary + n-gram frequencies = the model's learned parameters
create table if not exists pulsar_vocab (
  token text primary key, freq bigint not null default 0
);
create table if not exists pulsar_ngrams (
  n int not null, context text not null, next_token text not null,
  freq bigint not null default 1,
  primary key (n, context, next_token)
);
create index if not exists pulsar_ngrams_ctx on pulsar_ngrams(n, context);
-- versioned model state / metrics
create table if not exists pulsar_model_state (
  key text primary key, value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- ══ TRAINING CONTROL (the Swiftaw-only Trainer tab writes here) ════
create table if not exists pulsar_training_config (
  model text not null default 'pulsar', source text not null,
  enabled boolean not null default true, trusted boolean not null default false,
  updated_by text, updated_at timestamptz not null default now(),
  primary key (model, source)
);
insert into pulsar_training_config(model,source,enabled,trusted) values
  ('pulsar','lifecheck',true,false),('pulsar','chats',true,false),
  ('pulsar','web',true,false),('pulsar','swiftaw',true,true)
  on conflict (model,source) do nothing;

create table if not exists pulsar_training_exercises (
  id uuid primary key default gen_random_uuid(), model text not null default 'pulsar',
  kind text not null, config jsonb not null default '{}',
  status text not null default 'queued', score real, result jsonb,
  requested_by text, created_at timestamptz not null default now()
);
create table if not exists pulsar_training_runs (
  id uuid primary key default gen_random_uuid(), model text not null default 'pulsar',
  kind text not null default 'ngram', sources jsonb not null default '[]',
  status text not null default 'queued', metrics jsonb,
  started_at timestamptz, finished_at timestamptz, created_at timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════
--  RLS.  Ingestion tables accept INSERTs from the browser (publishable
--  key = anon) so data can start flowing, but do NOT allow reading other
--  people's rows. Everything sensitive is service-role / Swiftaw only.
-- ════════════════════════════════════════════════════════════════
alter table pulsar_models             enable row level security;
alter table pulsar_trusted_accounts   enable row level security;
alter table pulsar_messages           enable row level security;
alter table pulsar_signals            enable row level security;
alter table pulsar_facts              enable row level security;
alter table pulsar_web_cache          enable row level security;
alter table pulsar_feedback           enable row level security;
alter table pulsar_corpus             enable row level security;
alter table pulsar_vocab              enable row level security;
alter table pulsar_ngrams             enable row level security;
alter table pulsar_model_state        enable row level security;
alter table pulsar_training_config    enable row level security;
alter table pulsar_training_exercises enable row level security;
alter table pulsar_training_runs      enable row level security;

-- readable UI bits
drop policy if exists models_read on pulsar_models;
create policy models_read on pulsar_models for select using (true);
drop policy if exists cfg_read on pulsar_training_config;
create policy cfg_read on pulsar_training_config for select using (true);

-- append-only ingestion from the app (insert only, no select)
drop policy if exists msg_in on pulsar_messages;
create policy msg_in on pulsar_messages for insert with check (true);
drop policy if exists fb_in on pulsar_feedback;
create policy fb_in on pulsar_feedback for insert with check (true);
drop policy if exists corpus_in on pulsar_corpus;
create policy corpus_in on pulsar_corpus for insert with check (true);

-- facts: everyone reads; only Swiftaw may assert trust=1 (service role bypasses RLS)
drop policy if exists facts_read on pulsar_facts;
create policy facts_read on pulsar_facts for select using (true);
drop policy if exists facts_write on pulsar_facts;
create policy facts_write on pulsar_facts for insert with check (trust < 1.0 or is_pulsar_admin());

-- Swiftaw-only control tables
drop policy if exists cfg_admin on pulsar_training_config;
create policy cfg_admin on pulsar_training_config for all using (is_pulsar_admin()) with check (is_pulsar_admin());
drop policy if exists ex_admin on pulsar_training_exercises;
create policy ex_admin on pulsar_training_exercises for all using (is_pulsar_admin()) with check (is_pulsar_admin());
drop policy if exists run_admin on pulsar_training_runs;
create policy run_admin on pulsar_training_runs for all using (is_pulsar_admin()) with check (is_pulsar_admin());
drop policy if exists trusted_admin on pulsar_trusted_accounts;
create policy trusted_admin on pulsar_trusted_accounts for all using (is_pulsar_admin()) with check (is_pulsar_admin());

-- pulsar_signals / pulsar_vocab / pulsar_ngrams / pulsar_web_cache /
-- pulsar_model_state have NO anon policy on purpose -> service-role only
-- (the feed script + training jobs use the service_role key).

-- ── AFTER RUNNING: register Swiftaw as trusted ────────────────────
-- Find Swiftaw's user id (Authentication -> Users in the AUTH project),
-- then run this once with the real uuid:
-- insert into pulsar_trusted_accounts(user_id,username,note)
--   values ('PASTE-SWIFTAW-UUID','Swiftaw','Founder account, ground truth')
--   on conflict (user_id) do nothing;
