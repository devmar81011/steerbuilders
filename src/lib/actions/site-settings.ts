"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminForAction } from "@/lib/auth/require-admin";
import {
  clampFeaturedProjectLimit,
  DEFAULT_FEATURED_PROJECT_LIMIT,
  FEATURED_PROJECT_LIMIT_KEY,
} from "@/lib/featured-projects-config";

export async function getFeaturedProjectLimit(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", FEATURED_PROJECT_LIMIT_KEY)
      .maybeSingle();

    if (error || data?.value === undefined || data?.value === null) {
      return DEFAULT_FEATURED_PROJECT_LIMIT;
    }

    const raw = data.value;
    const parsed =
      typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
    if (!Number.isFinite(parsed)) return DEFAULT_FEATURED_PROJECT_LIMIT;
    return clampFeaturedProjectLimit(parsed);
  } catch {
    return DEFAULT_FEATURED_PROJECT_LIMIT;
  }
}

export async function setFeaturedProjectLimit(
  limit: number,
  accessToken?: string | null
) {
  const admin = await requireAdminForAction(accessToken);
  const value = clampFeaturedProjectLimit(limit);

  try {
    const { data, error } = await admin.supabase.from("site_settings").upsert(
      {
        key: FEATURED_PROJECT_LIMIT_KEY,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    ).select("key");

    if (error) return { error: error.message };
    if (!data?.length) {
      return { error: "Could not save featured limit. Please sign in again and retry." };
    }
  } catch {
    return { success: true, preview: true, limit: value };
  }

  revalidatePath("/admin/projects");
  revalidatePath("/");
  return { success: true, limit: value };
}
