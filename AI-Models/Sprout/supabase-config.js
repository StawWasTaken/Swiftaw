/**
 * Supabase Configuration for Sprout AI Model
 * Swiftaw — AI-Models/Sprout
 */

const SUPABASE_URL = 'https://zoryivifixzpswctecwh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcnlpdmlmaXh6cHN3Y3RlY3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNzI3MzksImV4cCI6MjA4OTc0ODczOX0.QzY7hN1viBghHYq4BDJa3jasgNbp7OODHy5aZF7TcIw';

// Initialize Supabase client
function createSupabaseClient() {
  if (typeof window !== 'undefined' && window.supabase) {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return null;
}

// Supabase table names for Sprout model
const SPROUT_TABLES = {
  TRAINING_DATA: 'sprout_training_data',
  CONVERSATIONS: 'sprout_conversations',
  RATINGS: 'sprout_ratings',
  MEDIA: 'sprout_media',
  DIRECTIVES: 'sprout_directives',
  WRITING_PATTERNS: 'sprout_writing_patterns',
  IDENTITY: 'sprout_identity'
};
