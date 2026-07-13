import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type AdminContext = {
  user: User;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

async function getAdminContext(): Promise<AdminContext | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata.role !== "admin") {
    return null;
  }

  return { user, supabase };
}

export async function requireAdmin() {
  const admin = await getAdminContext();
  if (!admin) {
    redirect("/admin/login");
  }

  return admin.user;
}

export async function requireAdminApi() {
  return getAdminContext();
}
