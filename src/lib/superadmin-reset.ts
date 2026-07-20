import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

export const RESET_TARGETS = [
  "attendance",
  "payroll",
  "employees",
  "sites",
  "projects",
  "inquiries",
] as const;

export type ResetTarget = (typeof RESET_TARGETS)[number];

export type ResetCounts = {
  attendance: number;
  payroll: number;
  employees: number;
  sites: number;
  projects: number;
  inquiries: number;
};

async function countRows(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  table: string
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getResetCounts(): Promise<ResetCounts> {
  const supabase = createServiceClient();
  if (!supabase) {
    throw new Error("Service role key is not configured.");
  }

  const [constructionAttendance, adminAttendance, payslips, payrollRuns, employees, sites, projects, inquiries] =
    await Promise.all([
      countRows(supabase, "attendance_weeks"),
      countRows(supabase, "admin_attendance_weeks"),
      countRows(supabase, "payslips"),
      countRows(supabase, "payroll_runs"),
      countRows(supabase, "employees"),
      countRows(supabase, "sites"),
      countRows(supabase, "projects"),
      countRows(supabase, "inquiries"),
    ]);

  return {
    attendance: constructionAttendance + adminAttendance,
    payroll: payslips + payrollRuns,
    employees,
    sites,
    projects,
    inquiries,
  };
}

async function deleteAll(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  table: string
): Promise<number> {
  const before = await countRows(supabase, table);
  if (before === 0) return 0;

  const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw new Error(`${table}: ${error.message}`);
  return before;
}

export async function runOperationalReset(
  targets: ResetTarget[]
): Promise<Record<string, number>> {
  const supabase = createServiceClient();
  if (!supabase) {
    throw new Error("Service role key is not configured.");
  }

  const cleared: Record<string, number> = {};
  const selected = new Set(targets);

  // FK-safe order: payslips → runs → attendance → employees → sites/projects/inquiries
  if (selected.has("payroll")) {
    cleared.payslips = await deleteAll(supabase, "payslips");
    cleared.payrollRuns = await deleteAll(supabase, "payroll_runs");
  }

  if (selected.has("attendance")) {
    cleared.attendanceWeeks = await deleteAll(supabase, "attendance_weeks");
    cleared.adminAttendanceWeeks = await deleteAll(
      supabase,
      "admin_attendance_weeks"
    );
  }

  if (selected.has("employees")) {
    // Payslips restrict employee deletes — clear remaining payroll first.
    if (!selected.has("payroll")) {
      cleared.payslips = (cleared.payslips ?? 0) + (await deleteAll(supabase, "payslips"));
      cleared.payrollRuns =
        (cleared.payrollRuns ?? 0) + (await deleteAll(supabase, "payroll_runs"));
    }
    if (!selected.has("attendance")) {
      cleared.attendanceWeeks =
        (cleared.attendanceWeeks ?? 0) +
        (await deleteAll(supabase, "attendance_weeks"));
      cleared.adminAttendanceWeeks =
        (cleared.adminAttendanceWeeks ?? 0) +
        (await deleteAll(supabase, "admin_attendance_weeks"));
    }
    cleared.employees = await deleteAll(supabase, "employees");
    cleared.dailyRates = await deleteAll(supabase, "daily_rates");
  }

  if (selected.has("sites")) {
    cleared.sites = await deleteAll(supabase, "sites");
  }

  if (selected.has("projects")) {
    cleared.projects = await deleteAll(supabase, "projects");
  }

  if (selected.has("inquiries")) {
    cleared.inquiries = await deleteAll(supabase, "inquiries");
  }

  return cleared;
}
