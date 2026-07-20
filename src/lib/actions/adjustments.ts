"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  mockDeductionRoleRates,
  type DeductionRoleRate,
} from "@/lib/deduction-role-rates";
import { slugifyDeductionCode } from "@/lib/deduction-lines";
import {
  mockPayrollAdjustments,
  type AdjustmentCalcType,
  type PayrollAdjustment,
} from "@/lib/payroll-adjustments";
import type { EmployeeCategory } from "@/lib/employee-categories";
import { requireAdmin } from "@/lib/auth/require-admin";

function mapAdjustment(row: Record<string, unknown>): PayrollAdjustment | null {
  const kind = row.kind as string;
  if (kind !== "deduction") return null;

  const calcType = row.calc_type as string;
  if (calcType !== "percent_of_gross" && calcType !== "fixed_per_period") {
    return null;
  }

  return {
    id: row.id as string,
    code: row.code as string,
    label: row.label as string,
    calcType: calcType as AdjustmentCalcType,
    value: Number(row.value),
    active: Boolean(row.active),
    description: (row.description as string) ?? "",
    sortOrder: Number(row.sort_order ?? 0),
    roleRates: [],
  };
}

function mapRoleRate(row: Record<string, unknown>): DeductionRoleRate {
  return {
    id: row.id as string,
    adjustmentId: row.adjustment_id as string,
    category: row.category as EmployeeCategory,
    designation: row.role as DeductionRoleRate["designation"],
    value: Number(row.value),
  };
}

function attachRoleRates(
  adjustments: PayrollAdjustment[],
  roleRates: DeductionRoleRate[]
): PayrollAdjustment[] {
  return adjustments.map((adjustment) => ({
    ...adjustment,
    roleRates: roleRates.filter((rate) => rate.adjustmentId === adjustment.id),
  }));
}

function attachMockRoleRates(
  adjustments: PayrollAdjustment[]
): PayrollAdjustment[] {
  return attachRoleRates(adjustments, mockDeductionRoleRates);
}

export async function getPayrollAdjustments(): Promise<PayrollAdjustment[]> {
  if (!isSupabaseConfigured()) {
    return attachMockRoleRates(mockPayrollAdjustments);
  }

  try {
    const supabase = await createClient();
    const [{ data: adjustments, error }, { data: roleRates, error: roleError }] =
      await Promise.all([
        supabase
          .from("payroll_adjustments")
          .select("*")
          .eq("kind", "deduction")
          .order("sort_order"),
        supabase.from("payroll_adjustment_role_rates").select("*"),
      ]);

    if (error) return [];

    const mapped = (adjustments ?? [])
      .map((row) => mapAdjustment(row as Record<string, unknown>))
      .filter((row): row is PayrollAdjustment => row !== null);

    if (!mapped.length) return [];

    const rates =
      roleError || !roleRates?.length
        ? []
        : roleRates.map((row) => mapRoleRate(row as Record<string, unknown>));

    return attachRoleRates(mapped, rates);
  } catch {
    return [];
  }
}

async function syncRoleRates(
  adjustmentId: string,
  roleRates: {
    category: EmployeeCategory;
    designation: string;
    value: number;
  }[]
) {
  try {
    const supabase = await createClient();
    await supabase
      .from("payroll_adjustment_role_rates")
      .delete()
      .eq("adjustment_id", adjustmentId);

    if (!roleRates.length) return;

    const { error } = await supabase.from("payroll_adjustment_role_rates").insert(
      roleRates.map((rate) => ({
        adjustment_id: adjustmentId,
        category: rate.category,
        // DB column is still named `role` for now
        role: rate.designation,
        value: rate.value,
      }))
    );

    if (error) throw error;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Could not sync role rates.");
  }
}

export async function createPayrollAdjustment(input: {
  label: string;
  code: string;
  calc_type: AdjustmentCalcType;
  value: number;
  description: string;
  active: boolean;
  role_rates?: {
    category: EmployeeCategory;
    designation: string;
    value: number;
  }[];
}) {
  await requireAdmin();
  const code = slugifyDeductionCode(input.code || input.label);
  if (!code) return { error: "Deduction code is required." };

  if (!isSupabaseConfigured()) {
    return { error: "Database is not configured." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payroll_adjustments")
      .insert({
        kind: "deduction",
        code,
        label: input.label.trim(),
        calc_type: input.calc_type,
        value: input.value,
        active: input.active,
        description: input.description.trim(),
        sort_order: 99,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };
    if (!data?.id) return { error: "Deduction was not created." };

    if (input.role_rates?.length) {
      await syncRoleRates(data.id as string, input.role_rates);
    }

    revalidatePath("/admin/contributions");
    revalidatePath("/admin/payroll");
    return { success: true, id: data.id as string };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not create deduction.",
    };
  }
}

export async function updatePayrollAdjustment(
  id: string,
  input: {
    label: string;
    calc_type: AdjustmentCalcType;
    value: number;
    active: boolean;
    description: string;
    role_rates?: {
      category: EmployeeCategory;
      designation: string;
      value: number;
    }[];
  }
) {
  await requireAdmin();
  if (!isSupabaseConfigured()) {
    return { error: "Database is not configured." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("payroll_adjustments")
      .update({
        label: input.label.trim(),
        calc_type: input.calc_type,
        value: input.value,
        active: input.active,
        description: input.description.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("kind", "deduction");
    if (error) return { error: error.message };

    if (input.role_rates) {
      await syncRoleRates(id, input.role_rates);
    }
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not update deduction.",
    };
  }

  revalidatePath("/admin/contributions");
  revalidatePath("/admin/payroll");
  return { success: true };
}

export async function deletePayrollAdjustment(id: string) {
  await requireAdmin();
  if (!isSupabaseConfigured()) {
    return { error: "Database is not configured." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("payroll_adjustments")
      .delete()
      .eq("id", id)
      .eq("kind", "deduction");
    if (error) return { error: error.message };
  } catch {
    return { error: "Could not delete deduction." };
  }

  revalidatePath("/admin/contributions");
  revalidatePath("/admin/payroll");
  return { success: true };
}
