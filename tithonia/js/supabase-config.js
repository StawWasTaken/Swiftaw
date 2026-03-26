/**
 * Supabase Configuration for Tithonia
 * Uses the shared Swiftawplex Supabase instance for user data and chats
 */

const TITHONIA_SUPABASE_URL = 'https://cnlhwcsmptsbmowhmioj.supabase.co';
const TITHONIA_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubGh3Y3NtcHRzYm1vd2htaW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjY0MTcsImV4cCI6MjA4OTk0MjQxN30.fFNqdjz0A8s8kyvlfWdEKhhiaPeKVcjxvgJje2n-Lo8';

// Initialize Supabase client for Tithonia
function createTithoniaSupabaseClient() {
  if (typeof window !== 'undefined' && window.supabase) {
    return window.supabase.createClient(TITHONIA_SUPABASE_URL, TITHONIA_SUPABASE_KEY);
  }
  return null;
}

// Supabase table names for Tithonia chats
const TITHONIA_TABLES = {
  CHATS: 'tithonia_chats',
  CHAT_FOLDERS: 'tithonia_chat_folders',
  CHAT_MESSAGES: 'tithonia_chat_messages',
  USER_PREFERENCES: 'tithonia_user_preferences'
};

// Ensure tables exist (called once during initialization)
async function initializeTithoniaTables(db) {
  if (!db) return;

  try {
    // Check if tables exist, if not they'll be created via migrations
    // The tables should be created via Supabase dashboard with the following schemas:

    // tithonia_chats:
    // - id (uuid, primary key)
    // - user_id (uuid, foreign key to auth.users)
    // - title (text)
    // - folder_id (uuid, nullable, foreign key to tithonia_chat_folders)
    // - is_pinned (boolean, default false)
    // - is_archived (boolean, default false)
    // - created_at (timestamp)
    // - updated_at (timestamp)

    // tithonia_chat_folders:
    // - id (uuid, primary key)
    // - user_id (uuid, foreign key to auth.users)
    // - name (text)
    // - icon (text, default '📁')
    // - created_at (timestamp)

    // tithonia_chat_messages:
    // - id (uuid, primary key)
    // - chat_id (uuid, foreign key to tithonia_chats)
    // - role (text, 'user' or 'assistant')
    // - text (text)
    // - metadata (jsonb, nullable)
    // - created_at (timestamp)

    // tithonia_user_preferences:
    // - id (uuid, primary key)
    // - user_id (uuid, foreign key to auth.users, unique)
    // - active_model (text, default 'sprout-1.4')
    // - selected_tool (text, nullable)
    // - updated_at (timestamp)

    console.log('Tithonia Supabase tables initialized');
  } catch (error) {
    console.error('Error initializing Tithonia tables:', error);
  }
}
