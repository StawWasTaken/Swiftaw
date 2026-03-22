-- ============================================
-- Sprout 1.1 — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Training Data
create table sprout_training_data (
  id uuid default gen_random_uuid() primary key,
  model text not null default 'sprout-1.1',
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
create table sprout_conversations (
  id uuid default gen_random_uuid() primary key,
  model text not null default 'sprout-1.1',
  messages jsonb not null default '[]',
  session_id text,
  created_at timestamptz default now()
);

-- 3. Ratings
create table sprout_ratings (
  id uuid default gen_random_uuid() primary key,
  model text not null default 'sprout-1.1',
  source_id uuid references sprout_training_data(id) on delete set null,
  rating integer not null,
  feedback text,
  conversation_id uuid references sprout_conversations(id) on delete set null,
  created_at timestamptz default now()
);

-- 4. Media
create table sprout_media (
  id uuid default gen_random_uuid() primary key,
  model text not null default 'sprout-1.1',
  type text not null,
  description text,
  url text not null,
  training_data_id uuid references sprout_training_data(id) on delete set null,
  created_at timestamptz default now()
);

-- ============================================
-- Indexes for performance
-- ============================================

create index idx_training_model_active on sprout_training_data(model, active);
create index idx_training_category on sprout_training_data(category);
create index idx_conversations_model on sprout_conversations(model);
create index idx_ratings_model on sprout_ratings(model);
create index idx_ratings_source on sprout_ratings(source_id);
create index idx_media_training on sprout_media(training_data_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table sprout_training_data enable row level security;
alter table sprout_conversations enable row level security;
alter table sprout_ratings enable row level security;
alter table sprout_media enable row level security;

-- Allow public read for training data (needed for Q&A matching)
create policy "Public can read active training data"
  on sprout_training_data for select
  using (active = true);

-- Allow public insert for training data (researchers add via anon key)
create policy "Public can insert training data"
  on sprout_training_data for insert
  with check (true);

-- Allow public update for training data
create policy "Public can update training data"
  on sprout_training_data for update
  using (true);

-- Allow public delete for training data
create policy "Public can delete training data"
  on sprout_training_data for delete
  using (true);

-- Conversations: public read/write
create policy "Public can read conversations"
  on sprout_conversations for select
  using (true);

create policy "Public can insert conversations"
  on sprout_conversations for insert
  with check (true);

-- Ratings: public read/write
create policy "Public can read ratings"
  on sprout_ratings for select
  using (true);

create policy "Public can insert ratings"
  on sprout_ratings for insert
  with check (true);

-- Media: public read/write
create policy "Public can read media"
  on sprout_media for select
  using (true);

create policy "Public can insert media"
  on sprout_media for insert
  with check (true);

-- ============================================
-- 5. Directives (Orders/Instructions)
-- Persistent instructions that shape how the AI behaves
-- ============================================

create table sprout_directives (
  id uuid default gen_random_uuid() primary key,
  model text not null default 'sprout-1.1',
  type text not null default 'instruction',
  directive text not null,
  priority integer not null default 0,
  active boolean default true,
  created_by text default 'researcher',
  created_at timestamptz default now(),
  updated_at timestamptz
);

create index idx_directives_model on sprout_directives(model, active);

alter table sprout_directives enable row level security;

create policy "Public can read directives"
  on sprout_directives for select using (true);
create policy "Public can insert directives"
  on sprout_directives for insert with check (true);
create policy "Public can update directives"
  on sprout_directives for update using (true);
create policy "Public can delete directives"
  on sprout_directives for delete using (true);

-- ============================================
-- 6. Writing Patterns
-- Stores analyzed writing style patterns from text samples
-- ============================================

create table sprout_writing_patterns (
  id uuid default gen_random_uuid() primary key,
  model text not null default 'sprout-1.1',
  source_label text not null,
  sample_text text not null,
  analysis jsonb not null default '{}',
  active boolean default true,
  created_by text default 'researcher',
  created_at timestamptz default now()
);

create index idx_writing_model on sprout_writing_patterns(model, active);

alter table sprout_writing_patterns enable row level security;

create policy "Public can read writing patterns"
  on sprout_writing_patterns for select using (true);
create policy "Public can insert writing patterns"
  on sprout_writing_patterns for insert with check (true);
create policy "Public can delete writing patterns"
  on sprout_writing_patterns for delete using (true);

-- ============================================
-- 7. Identity (Self-awareness / Consciousness)
-- Core beliefs, self-knowledge, and personality traits
-- ============================================

create table sprout_identity (
  id uuid default gen_random_uuid() primary key,
  model text not null default 'sprout-1.1',
  key text not null,
  value text not null,
  category text not null default 'personality',
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create index idx_identity_model on sprout_identity(model, active);
create unique index idx_identity_key on sprout_identity(model, key) where active = true;

alter table sprout_identity enable row level security;

create policy "Public can read identity"
  on sprout_identity for select using (true);
create policy "Public can insert identity"
  on sprout_identity for insert with check (true);
create policy "Public can update identity"
  on sprout_identity for update using (true);
create policy "Public can delete identity"
  on sprout_identity for delete using (true);
