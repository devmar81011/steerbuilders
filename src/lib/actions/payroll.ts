"use server";

import { revalidatePath } from "next/cache";
import { isPreviewPayrollEntryId } from "@/lib/preview-mode";
import { createClient } from "@/lib/supabase/server";
import { mockEmployees, mockPayroll, type Employee, type PayrollEntry } from "@/lib/mvp-data";
import type { EmployeeCategory } from "@/lib/employee-categories";
import { normalizeRateType, type RateType } from "@/lib/rate-types";
import { getDailyRates } from "@/lib/actions/rates";
import {
  applyAttendanceToPayrollEntries,
  getWeekStartsForPayrollPeriod,
} from "@/lib/payroll-from-attendance";
import {
  getCurrentPayrollPeriod,
  parsePayrollPeriodKey,
  type PayrollPeriod,
  type PayrollTab,
} from "@/lib/payroll-periods";
import { getPayrollAdjustments } from "@/lib/actions/adjustments";

function mapEmployee(row: Record<string, unknown>): Employee {
  return {
    id: row.id as string,
    name: row.name as string,
    category: (row.category as EmployeeCategory) ?? "construction",
    role: row.role as Employee["role"],
    rate: Number(row.rate),
    rateType: normalizeRateType(row.rate_type as string, row.category as EmployeeCategory),
    status: (row.status as "active" | "inactive") ?? "active",
  };
}

function mapPayrollRow(
  row: Record<string, unknown>,
  period: PayrollPeriod,
  category: EmployeeCategory
): PayrollEntry {
  const employee = row.employees as
    | { name: string; category: EmployeeCategory }
    | null
    | undefined;

  return {
    id: row.id as string,
    employeeId: row.employee_id as string,
    employeeName: employee?.name ?? "Unknown",
    category: employee?.category ?? category,
    periodKey: period.key,
    period: period.label,
    hours: Number(row.hours),
    grossPay: Number(row.gross_pay),
    deductions: Number(row.deductions),
    netPay: Number(row.net_pay),
    status: (row.status as "draft" | "processed") ?? "draft",
  };
}

function buildMockEntry(
  employee: Employee,
  period: PayrollPeriod
): PayrollEntry {
  const existing = mockPayroll.find(
    (entry) =>
      entry.employeeId === employee.id && entry.periodKey === period.key
  );

  if (existing) return { ...existing, period: period.label };

  const template = mockPayroll.find(
    (entry) =>
      entry.employeeId === employee.id && entry.category === employee.category
  );

  if (template) {
    return {
      ...template,
      id: `preview-${employee.id}-${period.key}`,
      periodKey: period.key,
      period: period.label,
      status: "draft",
    };
  }

  return {
    id: `preview-${employee.id}-${period.key}`,
    employeeId: employee.id,
    employeeName: employee.name,
    category: employee.category,
    periodKey: period.key,
    period: period.label,
    hours: 0,
    grossPay: 0,
    deductions: 0,
    netPay: 0,
    status: "draft",
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

async function getPayrollFromDatabase(
  category: PayrollTab,
  period: PayrollPeriod
): Promise<PayrollEntry[] | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payslips")
      .select("*, employees(name, category), payroll_runs(period_start, period_end)")
      .eq("payroll_runs.period_start", period.periodStart)
      .eq("payroll_runs.period_end", period.periodEnd);

    if (error) return null;

    const employees = (await getEmployees()).filter(
      (e) => e.status === "active" && e.category === category
    );

    const rows = (data ?? []).filter((row: Record<string, unknown>) => {
      const employee = row.employees as { category?: EmployeeCategory } | null;
      return employee?.category === category;
    });

    const byEmployee = new Map(
      rows.map((row: Record<string, unknown>) => [
        row.employee_id as string,
        mapPayrollRow(row, period, category),
      ])
    );

    return employees.map((employee) => {
      const existing = byEmployee.get(employee.id);
      if (existing) return existing;
      return buildMockEntry(employee, period);
    });
  } catch {
    return null;
  }
}

async function loadAttendanceForPeriod(category: PayrollTab, period: PayrollPeriod) {
  const {
    getConstructionAttendanceForWeek,
    getHourlyAttendanceForWeek,
  } = await import("@/lib/actions/attendance");

  const weekStarts = getWeekStartsForPayrollPeriod(category, period);
  const constructionRows: import("@/lib/attendance").AttendanceRow[] = [];
  const hourlyRows: import("@/lib/attendance").AdminAttendanceRow[] = [];

  if (category === "construction") {
    for (const weekStart of weekStarts) {
      const construction = await getConstructionAttendanceForWeek(weekStart);
      constructionRows.push(...construction.rows);
    }
    return { constructionRows, hourlyRows };
  }

  const hourlyCategory = category === "admin" ? "admin" : "ojt";
  for (const weekStart of weekStarts) {
    const hourly = await getHourlyAttendanceForWeek(weekStart, hourlyCategory);
    hourlyRows.push(...hourly.rows);
  }

  return { constructionRows, hourlyRows };
}

async function enrichPayrollFromAttendance(
  entries: PayrollEntry[],
  category: PayrollTab,
  period: PayrollPeriod,
  constructionRows: import("@/lib/attendance").AttendanceRow[],
  hourlyRows: import("@/lib/attendance").AdminAttendanceRow[]
): Promise<PayrollEntry[]> {
  const employees = (await getEmployees()).filter(
    (employee) => employee.status === "active" && employee.category === category
  );
  const [dailyRates, adjustments] = await Promise.all([
    getDailyRates(),
    getPayrollAdjustments(),
  ]);

  return applyAttendanceToPayrollEntries(
    entries,
    employees,
    dailyRates,
    constructionRows,
    hourlyRows,
    category,
    adjustments
  );
}

export async function getPayrollForPeriod(
  category: PayrollTab,
  periodKey?: string
): Promise<{
  entries: PayrollEntry[];
  period: PayrollPeriod;
  usingDatabase: boolean;
  constructionAttendance: import("@/lib/attendance").AttendanceRow[];
  hourlyAttendance: import("@/lib/attendance").AdminAttendanceRow[];
}> {
  const period = periodKey
    ? parsePayrollPeriodKey(category, periodKey)
    : getCurrentPayrollPeriod(category);

  const { constructionRows, hourlyRows } = await loadAttendanceForPeriod(
    category,
    period
  );

  const dbRows = await getPayrollFromDatabase(category, period);
  if (dbRows) {
    return {
      entries: await enrichPayrollFromAttendance(
        dbRows,
        category,
        period,
        constructionRows,
        hourlyRows
      ),
      period,
      usingDatabase: true,
      constructionAttendance: constructionRows,
      hourlyAttendance: hourlyRows,
    };
  }

  const employees = (await getEmployees()).filter(
    (e) => e.status === "active" && e.category === category
  );

  const mockRows = mockPayroll.filter(
    (entry) => entry.category === category && entry.periodKey === period.key
  );

  const byEmployee = new Map(mockRows.map((entry) => [entry.employeeId, entry]));

  const entries = employees.map((employee) => {
    const existing = byEmployee.get(employee.id);
    if (existing) return { ...existing, period: period.label };
    return buildMockEntry(employee, period);
  });

  return {
    entries: await enrichPayrollFromAttendance(
      entries,
      category,
      period,
      constructionRows,
      hourlyRows
    ),
    period,
    usingDatabase: false,
    constructionAttendance: constructionRows,
    hourlyAttendance: hourlyRows,
  };
}

export async function getPayrollEntries() {
  const construction = await getPayrollForPeriod("construction");
  const admin = await getPayrollForPeriod("admin");
  const ojt = await getPayrollForPeriod("ojt");
  return {
    constructionEntries: construction.entries,
    adminEntries: admin.entries,
    ojtEntries: ojt.entries,
    constructionPeriod: construction.period,
    adminPeriod: admin.period,
    ojtPeriod: ojt.period,
    usingDatabase:
      construction.usingDatabase && admin.usingDatabase && ojt.usingDatabase,
  };
}

export async function createEmployee(input: {
  name: string;
  category: EmployeeCategory;
  role: string;
  rate: number;
  rate_type: RateType;
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

export async function updateEmployee(
  id: string,
  input: {
    name: string;
    category: EmployeeCategory;
    role: string;
    rate: number;
    rate_type: RateType;
    status: "active" | "inactive";
  }
) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("employees").update(input).eq("id", id);
    if (error) return { error: error.message };
  } catch {
    return { success: true };
  }

  revalidatePath("/admin/employees");
  revalidatePath("/admin");
  return { success: true };
}

export async function updatePayrollEntry(
  id: string,
  input: {
    hours: number;
    gross_pay: number;
    deductions: number;
    net_pay: number;
    status: "draft" | "processed";
  }
) {
  if (isPreviewPayrollEntryId(id)) {
    return { success: true, preview: true };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("payslips").update(input).eq("id", id);
    if (error) return { error: error.message };
  } catch {
    return { success: true, preview: true };
  }

  revalidatePath("/admin/payroll");
  revalidatePath("/admin");
  return { success: true };
}
