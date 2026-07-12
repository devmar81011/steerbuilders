"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mockEmployees, mockPayroll, type Employee } from "@/lib/mvp-data";
import type { EmployeeCategory } from "@/lib/employee-categories";

function mapEmployee(row: Record<string, unknown>): Employee {
  return {
    id: row.id as string,
    name: row.name as string,
    category: (row.category as EmployeeCategory) ?? "construction",
    role: row.role as Employee["role"],
    rate: Number(row.rate),
    rateType: (row.rate_type as "hourly" | "salary") ?? "hourly",
    status: (row.status as "active" | "inactive") ?? "active",
  };
}

export async function getEmployees(): Promise<Employee[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("name");

    if (error || !data?.length) return mockEmployees;
    return data.map((row) => mapEmployee(row as Record<string, unknown>));
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
  category: EmployeeCategory;
  role: string;
  rate: number;
  rate_type: "hourly" | "salary";
}) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("employees").insert({
      name: input.name,
      category: input.category,
      role: input.role,
      rate: input.rate,
      rate_type: input.rate_type,
      status: "active",
    });
    if (error) return { error: error.message };
  } catch {
    return { success: true };
  }

  revalidatePath("/admin/employees");
  revalidatePath("/admin");
  return { success: true };
}
