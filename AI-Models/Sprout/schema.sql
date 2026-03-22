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
-- Notify PostgREST to reload schema cache
-- Run this after creating new tables so the API
-- recognizes them immediately
-- ============================================
notify pgrst, 'reload schema';
