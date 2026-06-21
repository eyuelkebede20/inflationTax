// ---------------------------------------------------------------------------
// Configuration. Fill these in, OR set them as Vercel/Vite environment
// variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Env vars win when
// present, so you can deploy without editing this file.
// ---------------------------------------------------------------------------

const ENV_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ENV_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const SUPABASE_URL = ENV_URL || "PASTE_YOUR_PROJECT_URL";
export const SUPABASE_ANON_KEY = ENV_KEY || "PASTE_YOUR_ANON_KEY";

// Default inflation rate. Users can override this per-account in Settings.
export const DEFAULT_INFLATION_RATE = 0.152;

// True only when real Supabase credentials are present. When false the app
// runs in fully anonymous (localStorage-only) mode and hides auth UI.
export const SUPABASE_ENABLED =
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20;
