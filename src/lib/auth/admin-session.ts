"use client";

import { createClient } from "@/lib/supabase/client";

export async function getAdminAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
