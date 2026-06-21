import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_ENABLED, SUPABASE_URL } from "../config";

// Only create a real client when credentials are configured. Otherwise the app
// runs entirely on localStorage and all auth UI is hidden.
export const supabase: SupabaseClient | null = SUPABASE_ENABLED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
