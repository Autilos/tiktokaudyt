import { createClient } from '@supabase/supabase-js'

// Only expose public/anon keys to frontend - never service role or secrets
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://xcbufsemfbklgbcmkitn.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjYnVmc2VtZmJrbGdiY21raXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMzA0NjIsImV4cCI6MjA3NzgwNjQ2Mn0.5-U-cKNMZ0ooB-gIKsBlBXr2gxFMmAfo5aHaTkJvLA0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
