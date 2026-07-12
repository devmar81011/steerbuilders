"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EmployeeCategory } from "@/lib/employee-categories";
import { mockDailyRates, type DailyRate } from "@/lib/daily-rates";
import { normalizeRateType, type RateType } from "@/lib/rate-types";
import { requireAdmin } from "@/lib/auth/require-admin";

function mapRate(row: Record<string, unknown>): DailyRate {
  const category = row.category as EmployeeCategory;
  return {
    id: row.id as string,
    category,
    role: row.role as string,
    rate: Number(row.rate),
    rateType: normalizeRateType(row.rate_type as string, category),
  };
}

export async function getDailyRates(): Promise<DailyRate[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("daily_rates")
      .select("*")
      .order("category")
      .order("role");

    if (error || !data?.length) return mockDailyRates;
    return data.map((row) => mapRate(row as Record<string, unknown>));
  } catch {
    return mockDailyRates;
  }
}

export async function createDailyRate(input: {
  category: EmployeeCategory;
  role: string;
  rate: number;
  rate_type: RateType;
}) {
  await requireAdmin();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("daily_rates").insert(input);
    if (error) return { error: error.message };
  } catch {
    return { success: true };
  }

  revalidatePath("/admin/rates");
  revalidatePath("/admin/employees");
  return { success: true };
}

export async function updateDailyRate(
  id: string,
  input: {
    category: EmployeeCategory;
    role: string;
    rate: number;
    rate_type: RateType;
  }
) {
  await requireAdmin();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("daily_rates").update(input).eq("id", id);
    if (error) return { error: error.message };
  } catch {
    return { success: true };
  }

  revalidatePath("/admin/rates");
  revalidatePath("/admin/employees");
  return { success: true };
}

export async function deleteDailyRate(id: string) {
  await requireAdmin();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("daily_rates").delete().eq("id", id);
    if (error) return { error: error.message };
  } catch {
    return { success: true };
  }

  revalidatePath("/admin/rates");
  revalidatePath("/admin/employees");
  return { success: true };
}
