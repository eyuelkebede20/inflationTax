// ---------------------------------------------------------------------------
// Configuration. Fill these in, OR set them as Vercel/Vite environment
// variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Env vars win when
// present, so you can deploy without editing this file.
// ---------------------------------------------------------------------------

const ENV_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ENV_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const SUPABASE_URL = ENV_URL || "PASTE_YOUR_PROJECT_URL";
export const SUPABASE_ANON_KEY = ENV_KEY || "PASTE_YOUR_ANON_KEY";

// Default inflation rate. Overridable in the Superadmin dashboard (app_settings).
export const DEFAULT_INFLATION_RATE = 0.152;

// Fraction of a "rental" entry's income fed to the curfew algorithm (idea #7).
export const DEFAULT_RENTAL_SHARE = 0.5;

// Auth is scaffolded but OFF for now (idea #8 — "auth can be commented and used
// later"). While false, the app runs without enforced sign-in and the nav shows
// a dev Role/Branch switcher so every dashboard is reachable. Flip to true once
// Supabase auth + the profiles table are wired up.
export const AUTH_ENABLED = false;

// True only when real Supabase credentials are present. When false the app
// runs in fully anonymous (localStorage-only) mode and hides auth UI.
export const SUPABASE_ENABLED =
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20;
