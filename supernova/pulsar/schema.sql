-- ════════════════════════════════════════════════════════════════
--  PULSAR — Supernova's own model. Database schema.
--  Run this in the AI Supabase project (xrmmedxbqmwjcucyjosl).
--  This is OUR AI's brain: training corpus, chat logs, feedback,
--  web-search cache + sources, a trust layer, and a training queue.
--
--  Auth note: this project should share Swiftaw's auth (same JWT secret
--  as mwszvynzzugbowdngzab) so auth.uid() lines up across both, OR all
--  privileged writes go through the pulsar-chat Edge Function using the
--  service_role key. RLS below assumes shared auth for user-owned rows.
-- ════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";
-- for embeddings later:  create extension if not exists vector;

-- ── who Pulsar trusts 100% (the Swiftaw account) ──────────────────
create table if not exists pulsar_trusted_accounts (
  user_id     uuid primary key,          -- Swiftaw's auth user id
  username    text not null,             -- 'Swiftaw'
  note        text,
  added_at    timestamptz not null default now()
);

create or replace function is_pulsar_admin() returns boolean
language sql stable as $$
  select exists (select 1 from pulsar_trusted_accounts where user_id = auth.uid());
$$;

-- ── model registry ────────────────────────────────────────────────
create table if not exists pulsar_models (
  id          text primary key,          -- 'pulsar'
  name        text not null,             -- 'Pulsar'
  status      text not null default 'training',  -- training | preview | live
  created_at  timestamptz not null default now()
);
insert into pulsar_models (id, name, status)
  values ('pulsar', 'Pulsar', 'training')
  on conflict (id) do nothing;

-- ── conversations + messages (server-side chat history) ───────────
create table if not exists pulsar_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid(),
  title       text not null default 'New chat',
  model       text not null default 'pulsar' references pulsar_models(id),
  pinned      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists pulsar_messages (
  id          uuid primary key default gen_random_uuid(),
  conv_id     uuid not null references pulsar_conversations(id) on delete cascade,
  user_id     uuid not null default auth.uid(),
  role        text not null check (role in ('user','assistant','system')),
  content     text not null default '',
  reasoning   text,                      -- the "thinking" trace
  sources     jsonb not null default '[]',  -- [{title,url}] used for the answer
  feedback    text check (feedback in ('up','down')),  -- RLHF signal
  created_at  timestamptz not null default now()
);
create index if not exists pulsar_messages_conv on pulsar_messages(conv_id);

-- ── training corpus ───────────────────────────────────────────────
-- what data types are enabled for a model (driven by the Trainer tab)
create table if not exists pulsar_training_config (
  model       text not null default 'pulsar' references pulsar_models(id),
  source      text not null,             -- lifecheck | chats | web | swiftaw
  enabled     boolean not null default true,
  trusted     boolean not null default false,  -- swiftaw = true
  updated_by  uuid,
  updated_at  timestamptz not null default now(),
  primary key (model, source)
);
insert into pulsar_training_config (model, source, enabled, trusted) values
  ('pulsar','lifecheck', true,  false),
  ('pulsar','chats',     true,  false),
  ('pulsar','web',       true,  false),
  ('pulsar','swiftaw',   true,  true)
  on conflict (model, source) do nothing;

-- behavioural signals imported from Lifecheck (session_summary vectors)
create table if not exists pulsar_signals (
  id            bigint generated always as identity primary key,
  source        text not null default 'lifecheck',
  session_key   text,                    -- lifecheck session id (dedup)
  label         text,                    -- 'human' | 'bot' | null (unlabelled)
  features      jsonb not null,          -- durationMs, via, touch, wrongTaps, cursor{...}, ...
  imported_at   timestamptz not null default now(),
  unique (source, session_key)
);

-- knowledge / facts, each with a trust level and provenance
create table if not exists pulsar_facts (
  id           uuid primary key default gen_random_uuid(),
  statement    text not null,
  trust        real not null default 0.5 check (trust >= 0 and trust <= 1),  -- 1.0 = Swiftaw ground truth
  source_type  text not null default 'web',   -- web | swiftaw | chat | model
  source_url   text,
  asserted_by  uuid,                     -- if a user asserted it
  created_at   timestamptz not null default now()
);

-- ── web search cache + sources ────────────────────────────────────
create table if not exists pulsar_web_cache (
  id           uuid primary key default gen_random_uuid(),
  query        text not null,
  results      jsonb not null default '[]',  -- [{title,url,snippet,favicon}]
  fetched_at   timestamptz not null default now()
);
create index if not exists pulsar_web_cache_q on pulsar_web_cache(query);

-- ── feedback (kept separate for training even if a message is deleted) ──
create table if not exists pulsar_feedback (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid(),
  model        text not null default 'pulsar',
  prompt       text,
  response     text,
  rating       text not null check (rating in ('up','down')),
  created_at   timestamptz not null default now()
);

-- ── training: drills / mini-games + runs ──────────────────────────
create table if not exists pulsar_training_exercises (
  id           uuid primary key default gen_random_uuid(),
  model        text not null default 'pulsar',
  kind         text not null,            -- factcheck | skeptic | reason | voice
  config       jsonb not null default '{}',
  status       text not null default 'queued',  -- queued | running | passed | failed
  score        real,
  result       jsonb,
  requested_by uuid,
  created_at   timestamptz not null default now()
);

create table if not exists pulsar_training_runs (
  id           uuid primary key default gen_random_uuid(),
  model        text not null default 'pulsar',
  kind         text not null default 'finetune',
  sources      jsonb not null default '[]',
  status       text not null default 'queued',
  metrics      jsonb,
  started_at   timestamptz,
  finished_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════
--  RLS
-- ════════════════════════════════════════════════════════════════
alter table pulsar_conversations       enable row level security;
alter table pulsar_messages            enable row level security;
alter table pulsar_feedback            enable row level security;
alter table pulsar_training_config     enable row level security;
alter table pulsar_training_exercises  enable row level security;
alter table pulsar_training_runs       enable row level security;
alter table pulsar_facts               enable row level security;
alter table pulsar_trusted_accounts    enable row level security;
alter table pulsar_signals             enable row level security;
alter table pulsar_web_cache           enable row level security;
alter table pulsar_models              enable row level security;

-- users own their conversations + messages + feedback
create policy conv_own on pulsar_conversations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy msg_own on pulsar_messages
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy fb_own on pulsar_feedback
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- anyone signed in can read the model list + training config (to show the UI)
create policy models_read on pulsar_models for select using (true);
create policy cfg_read on pulsar_training_config for select using (true);

-- ONLY the Swiftaw (admin) account can change training config / exercises /
-- runs / trusted facts / the trusted-accounts table itself.
create policy cfg_admin on pulsar_training_config
  for all using (is_pulsar_admin()) with check (is_pulsar_admin());
create policy ex_admin on pulsar_training_exercises
  for all using (is_pulsar_admin()) with check (is_pulsar_admin());
create policy run_admin on pulsar_training_runs
  for all using (is_pulsar_admin()) with check (is_pulsar_admin());
create policy trusted_admin on pulsar_trusted_accounts
  for all using (is_pulsar_admin()) with check (is_pulsar_admin());

-- facts: everyone reads; only the Swiftaw account may write a trust=1 fact,
-- and no one via the anon key may forge ground truth (service role bypasses RLS).
create policy facts_read on pulsar_facts for select using (true);
create policy facts_write on pulsar_facts for insert
  with check ( trust < 1.0 or is_pulsar_admin() );

-- signals + web cache are service-role only (no anon policies = locked).

-- ── SEED: register the Swiftaw account as trusted ─────────────────
-- Replace the uuid with Swiftaw's real auth user id, then run:
-- insert into pulsar_trusted_accounts (user_id, username, note)
--   values ('00000000-0000-0000-0000-000000000000', 'Swiftaw', 'Founder account, ground truth')
--   on conflict (user_id) do nothing;
