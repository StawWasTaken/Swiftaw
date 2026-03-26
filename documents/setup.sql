-- ═══════════════════════════════════════════
-- SWIFTAW DOCUMENTS — Supabase Table Setup
-- Run this in the Supabase SQL Editor:
--   https://supabase.com/dashboard → SQL Editor
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.documents (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       text NOT NULL,
  project     text DEFAULT 'General',
  subject     text DEFAULT '',
  body        text NOT NULL,
  author      text DEFAULT 'Swiftaw Team',
  dept        text DEFAULT 'Swiftaw',
  date        text,
  visibility  text DEFAULT 'public' CHECK (visibility IN ('public', 'intern')),
  created_at  timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read documents
CREATE POLICY "Allow public read"
  ON public.documents FOR SELECT
  USING (true);

-- Allow anyone to insert documents
CREATE POLICY "Allow public insert"
  ON public.documents FOR INSERT
  WITH CHECK (true);

-- Allow anyone to delete documents
CREATE POLICY "Allow public delete"
  ON public.documents FOR DELETE
  USING (true);

-- Allow anyone to update documents
CREATE POLICY "Allow public update"
  ON public.documents FOR UPDATE
  USING (true);

-- Enable Realtime for live sync across all users
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
