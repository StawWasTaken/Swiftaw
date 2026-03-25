// ═══════════════════════════════════════════
// SWIFTAWPLEX – SUPABASE CONFIGURATION
// ═══════════════════════════════════════════

const SUPABASE_URL = 'https://cnlhwcsmptsbmowhmioj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubGh3Y3NtcHRzYm1vd2htaW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjY0MTcsImV4cCI6MjA4OTk0MjQxN30.fFNqdjz0A8s8kyvlfWdEKhhiaPeKVcjxvgJje2n-Lo8';

let supabase;
try {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.error('Failed to init Supabase:', e);
}

export { supabase, SUPABASE_URL, SUPABASE_ANON_KEY };
export default supabase;
