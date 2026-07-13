const DEFAULT_SUPABASE_URL = "https://stoocngdvtgvbbvdjmdo.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "sb_publishable_DRiclP8oRtQvspRQ2rPelg_OcVtpSNs";

function resolveSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url && !url.includes("your-project")) return url;
  return DEFAULT_SUPABASE_URL;
}

function resolveSupabaseAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (key && key !== "your-publishable-anon-key") return key;
  return DEFAULT_SUPABASE_ANON_KEY;
}

export function isSupabaseConfigured() {
  return Boolean(resolveSupabaseUrl() && resolveSupabaseAnonKey());
}

export function getSupabaseEnv() {
  if (!isSupabaseConfigured()) return null;

  return {
    url: resolveSupabaseUrl(),
    key: resolveSupabaseAnonKey(),
  };
}

/** Production admin host with Supabase env vars configured. */
export function getAdminHost() {
  return process.env.NEXT_PUBLIC_ADMIN_HOST ?? "steerbuilders.vercel.app";
}

export function shouldRedirectToConfiguredAdminHost(host: string | null) {
  if (!host || host.includes("localhost")) return false;
  if (isSupabaseConfigured()) return false;
  return host !== getAdminHost();
}
