export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      !url.includes("your-project") &&
      key !== "your-publishable-anon-key"
  );
}

export function getSupabaseEnv() {
  if (!isSupabaseConfigured()) return null;

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
