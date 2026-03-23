-- ============================================
-- Sprout 1.2 — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- Safe to re-run: uses IF NOT EXISTS throughout
-- ============================================

-- 1. Training Data
create table if not exists sprout_training_data (
  id uuid default gen_random_uuid() primary key,
  model text not null default 'sprout-1.2',
  question text not null,
  answer text not null,
  category text not null default 'general',
  tags text[] default '{}',
  created_by text default 'researcher',
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- 2. Conversations
create table if not exists sprout_conversations (
  id uuid default gen_random_uuid() primary key,
  model text not null default 'sprout-1.2',
  messages jsonb not null default '[]',
  session_id text,
  created_at timestamptz default now()
);

-- 3. Ratings
create table if not exists sprout_ratings (
  id uuid default gen_random_uuid() primary key,
  model text not null default 'sprout-1.2',
  source_id uuid references sprout_training_data(id) on delete set null,
  rating integer not null,
  feedback text,
  conversation_id uuid references sprout_conversations(id) on delete set null,
  created_at timestamptz default now()
);

-- 4. Media
create table if not exists sprout_media (
  id uuid default gen_random_uuid() primary key,
  model text not null default 'sprout-1.2',
  type text not null,
  description text,
  url text not null,
  training_data_id uuid references sprout_training_data(id) on delete set null,
  created_at timestamptz default now()
);

-- ============================================
-- Indexes for performance
-- ============================================

create index if not exists idx_training_model_active on sprout_training_data(model, active);
create index if not exists idx_training_category on sprout_training_data(category);
create index if not exists idx_conversations_model on sprout_conversations(model);
create index if not exists idx_ratings_model on sprout_ratings(model);
create index if not exists idx_ratings_source on sprout_ratings(source_id);
create index if not exists idx_media_training on sprout_media(training_data_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table sprout_training_data enable row level security;
alter table sprout_conversations enable row level security;
alter table sprout_ratings enable row level security;
alter table sprout_media enable row level security;

-- Training data policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'sprout_training_data' and policyname = 'Public can read active training data') then
    create policy "Public can read active training data" on sprout_training_data for select using (active = true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_training_data' and policyname = 'Public can insert training data') then
    create policy "Public can insert training data" on sprout_training_data for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_training_data' and policyname = 'Public can update training data') then
    create policy "Public can update training data" on sprout_training_data for update using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_training_data' and policyname = 'Public can delete training data') then
    create policy "Public can delete training data" on sprout_training_data for delete using (true);
  end if;
end $$;

-- Conversations policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'sprout_conversations' and policyname = 'Public can read conversations') then
    create policy "Public can read conversations" on sprout_conversations for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_conversations' and policyname = 'Public can insert conversations') then
    create policy "Public can insert conversations" on sprout_conversations for insert with check (true);
  end if;
end $$;

-- Ratings policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'sprout_ratings' and policyname = 'Public can read ratings') then
    create policy "Public can read ratings" on sprout_ratings for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_ratings' and policyname = 'Public can insert ratings') then
    create policy "Public can insert ratings" on sprout_ratings for insert with check (true);
  end if;
end $$;

-- Media policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'sprout_media' and policyname = 'Public can read media') then
    create policy "Public can read media" on sprout_media for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_media' and policyname = 'Public can insert media') then
    create policy "Public can insert media" on sprout_media for insert with check (true);
  end if;
end $$;

-- ============================================
-- 5. Directives (Orders/Instructions)
-- Persistent instructions that shape how the AI behaves
-- ============================================

create table if not exists sprout_directives (
  id uuid default gen_random_uuid() primary key,
  model text not null default 'sprout-1.2',
  type text not null default 'instruction',
  directive text not null,
  priority integer not null default 0,
  active boolean default true,
  created_by text default 'researcher',
  created_at timestamptz default now(),
  updated_at timestamptz
);

create index if not exists idx_directives_model on sprout_directives(model, active);

alter table sprout_directives enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'sprout_directives' and policyname = 'Public can read directives') then
    create policy "Public can read directives" on sprout_directives for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_directives' and policyname = 'Public can insert directives') then
    create policy "Public can insert directives" on sprout_directives for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_directives' and policyname = 'Public can update directives') then
    create policy "Public can update directives" on sprout_directives for update using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_directives' and policyname = 'Public can delete directives') then
    create policy "Public can delete directives" on sprout_directives for delete using (true);
  end if;
end $$;

-- ============================================
-- 6. Writing Patterns
-- Stores analyzed writing style patterns from text samples
-- ============================================

create table if not exists sprout_writing_patterns (
  id uuid default gen_random_uuid() primary key,
  model text not null default 'sprout-1.2',
  source_label text not null,
  sample_text text not null,
  analysis jsonb not null default '{}',
  active boolean default true,
  created_by text default 'researcher',
  created_at timestamptz default now()
);

create index if not exists idx_writing_model on sprout_writing_patterns(model, active);

alter table sprout_writing_patterns enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'sprout_writing_patterns' and policyname = 'Public can read writing patterns') then
    create policy "Public can read writing patterns" on sprout_writing_patterns for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_writing_patterns' and policyname = 'Public can insert writing patterns') then
    create policy "Public can insert writing patterns" on sprout_writing_patterns for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_writing_patterns' and policyname = 'Public can delete writing patterns') then
    create policy "Public can delete writing patterns" on sprout_writing_patterns for delete using (true);
  end if;
end $$;

-- ============================================
-- 7. Identity (Self-awareness / Consciousness)
-- Core beliefs, self-knowledge, and personality traits
-- ============================================

create table if not exists sprout_identity (
  id uuid default gen_random_uuid() primary key,
  model text not null default 'sprout-1.2',
  key text not null,
  value text not null,
  category text not null default 'personality',
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create index if not exists idx_identity_model on sprout_identity(model, active);

-- Use a DO block for unique index since CREATE UNIQUE INDEX IF NOT EXISTS is supported
create unique index if not exists idx_identity_key on sprout_identity(model, key) where active = true;

alter table sprout_identity enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'sprout_identity' and policyname = 'Public can read identity') then
    create policy "Public can read identity" on sprout_identity for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_identity' and policyname = 'Public can insert identity') then
    create policy "Public can insert identity" on sprout_identity for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_identity' and policyname = 'Public can update identity') then
    create policy "Public can update identity" on sprout_identity for update using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_identity' and policyname = 'Public can delete identity') then
    create policy "Public can delete identity" on sprout_identity for delete using (true);
  end if;
end $$;

-- ============================================
-- 8. Knowledge Graph
-- Stores extracted concepts and their connections
-- Tithonia builds a web of understanding from analyzed text
-- ============================================

create table if not exists sprout_knowledge_graph (
  id uuid default gen_random_uuid() primary key,
  model text not null default 'sprout-1.2',
  concept text not null,
  related_concept text,
  relationship text not null default 'related_to',
  strength float not null default 0.5,
  source_text text,
  category text not null default 'general',
  tags text[] default '{}',
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create index if not exists idx_knowledge_model on sprout_knowledge_graph(model, active);
create index if not exists idx_knowledge_concept on sprout_knowledge_graph(concept);
create index if not exists idx_knowledge_related on sprout_knowledge_graph(related_concept);
create index if not exists idx_knowledge_category on sprout_knowledge_graph(category);

alter table sprout_knowledge_graph enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'sprout_knowledge_graph' and policyname = 'Public can read knowledge') then
    create policy "Public can read knowledge" on sprout_knowledge_graph for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_knowledge_graph' and policyname = 'Public can insert knowledge') then
    create policy "Public can insert knowledge" on sprout_knowledge_graph for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_knowledge_graph' and policyname = 'Public can update knowledge') then
    create policy "Public can update knowledge" on sprout_knowledge_graph for update using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_knowledge_graph' and policyname = 'Public can delete knowledge') then
    create policy "Public can delete knowledge" on sprout_knowledge_graph for delete using (true);
  end if;
end $$;

-- ============================================
-- 9. Learning Log
-- Tracks what Tithonia learned, when, and how it evolved
-- ============================================

create table if not exists sprout_learning_log (
  id uuid default gen_random_uuid() primary key,
  model text not null default 'sprout-1.2',
  event_type text not null default 'text_ingestion',
  summary text not null,
  details jsonb not null default '{}',
  source_type text default 'paste',
  knowledge_gained integer default 0,
  connections_made integer default 0,
  created_at timestamptz default now()
);

create index if not exists idx_learning_model on sprout_learning_log(model);
create index if not exists idx_learning_type on sprout_learning_log(event_type);

alter table sprout_learning_log enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'sprout_learning_log' and policyname = 'Public can read learning log') then
    create policy "Public can read learning log" on sprout_learning_log for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_learning_log' and policyname = 'Public can insert learning log') then
    create policy "Public can insert learning log" on sprout_learning_log for insert with check (true);
  end if;
end $$;

-- ============================================
-- 10. Self-Reflections
-- Tithonia's own thoughts about its knowledge gaps,
-- strengths, and areas for growth
-- ============================================

create table if not exists sprout_self_reflections (
  id uuid default gen_random_uuid() primary key,
  model text not null default 'sprout-1.2',
  reflection_type text not null default 'gap_analysis',
  content text not null,
  priority integer not null default 0,
  resolved boolean default false,
  resolution text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create index if not exists idx_reflections_model on sprout_self_reflections(model);
create index if not exists idx_reflections_type on sprout_self_reflections(reflection_type);

alter table sprout_self_reflections enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'sprout_self_reflections' and policyname = 'Public can read reflections') then
    create policy "Public can read reflections" on sprout_self_reflections for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_self_reflections' and policyname = 'Public can insert reflections') then
    create policy "Public can insert reflections" on sprout_self_reflections for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sprout_self_reflections' and policyname = 'Public can update reflections') then
    create policy "Public can update reflections" on sprout_self_reflections for update using (true);
  end if;
end $$;

-- ============================================
-- Notify PostgREST to reload schema cache
-- Run this after creating new tables so the API
-- recognizes them immediately
-- ============================================
notify pgrst, 'reload schema';
