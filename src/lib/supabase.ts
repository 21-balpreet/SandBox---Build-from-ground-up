import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "https://your-project-id.supabase.co" &&
  !supabaseUrl.includes("your-project-id")
);

// Fallback client parameters to allow seamless preview testing when credentials are pending
const validUrl = isSupabaseConfigured ? supabaseUrl : "https://placeholder-project.supabase.co";
const validKey = isSupabaseConfigured ? supabaseAnonKey : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

export const supabase: SupabaseClient = createClient(validUrl, validKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
