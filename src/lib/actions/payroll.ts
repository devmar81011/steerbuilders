"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mockEmployees, mockPayroll } from "@/lib/mvp-data";

export async function getEmployees() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("name");

    if (error || !data?.length) return mockEmployees;
    return data;
  } catch {
    return mockEmployees;
  }
}

export async function getPayrollEntries() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payslips")
      .select("*, employees(name)")
      .order("created_at", { ascending: false });

    if (error || !data?.length) return mockPayroll;
    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      employeeId: row.employee_id as string,
      employeeName: (row.employees as { name: string })?.name ?? "Unknown",
      period: "Current period",
      hours: Number(row.hours),
      grossPay: Number(row.gross_pay),
      deductions: Number(row.deductions),
      netPay: Number(row.net_pay),
      status: "processed" as const,
    }));
  } catch {
    return mockPayroll;
  }
}

export async function createEmployee(input: {
  name: string;
  role: string;
  rate: number;
  rate_type: "hourly" | "salary";
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("employees").insert({
    ...input,
    status: "active",
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/employees");
  revalidatePath("/admin");
  return { success: true };
}
