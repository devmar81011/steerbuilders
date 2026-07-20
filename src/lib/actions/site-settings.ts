"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireAdminForAction } from "@/lib/auth/require-admin";
import {
  clampFeaturedProjectLimit,
  DEFAULT_FEATURED_PROJECT_LIMIT,
  FEATURED_PROJECT_LIMIT_KEY,
} from "@/lib/featured-projects-config";
import {
  DEFAULT_DISBURSEMENT_METHODS,
  DISBURSEMENT_METHODS_KEY,
  normalizeDisbursementMethods,
} from "@/lib/disbursement-methods";
import {
  DEFAULT_OT_PAY_PERCENT,
  OT_PAY_PERCENT_KEY,
  normalizeOtPayPercent,
} from "@/lib/ot-pay-rate";

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

export async function getDisbursementMethods(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", DISBURSEMENT_METHODS_KEY)
      .maybeSingle();

    if (error || data?.value === undefined || data?.value === null) {
      return [...DEFAULT_DISBURSEMENT_METHODS];
    }

    return normalizeDisbursementMethods(data.value);
  } catch {
    return [...DEFAULT_DISBURSEMENT_METHODS];
  }
}

export async function setDisbursementMethods(methods: string[]) {
  await requireAdmin();
  const value = normalizeDisbursementMethods(methods);

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("site_settings").upsert(
      {
        key: DISBURSEMENT_METHODS_KEY,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

    if (error) return { error: error.message };
  } catch {
    return { error: "Could not save disbursement methods." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/payroll");
  return { success: true, methods: value };
}

export async function getOtPayPercent(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", OT_PAY_PERCENT_KEY)
      .maybeSingle();

    if (error || data?.value === undefined || data?.value === null) {
      return DEFAULT_OT_PAY_PERCENT;
    }

    return normalizeOtPayPercent(data.value);
  } catch {
    return DEFAULT_OT_PAY_PERCENT;
  }
}

export async function setOtPayPercent(percent: number) {
  await requireAdmin();
  const value = normalizeOtPayPercent(percent);

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("site_settings").upsert(
      {
        key: OT_PAY_PERCENT_KEY,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

    if (error) return { error: error.message };
  } catch {
    return { error: "Could not save OT pay percent." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/payroll");
  revalidatePath("/admin/attendance");
  return { success: true, percent: value };
}
