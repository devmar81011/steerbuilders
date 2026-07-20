"use server";

import { revalidatePath } from "next/cache";
import {
  isPreviewEmployeeId,
  isPreviewPayrollEntryId,
  parsePreviewPayrollEntryId,
} from "@/lib/preview-mode";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockEmployees, mockPayroll, type Employee, type PayrollEntry } from "@/lib/mvp-data";
import type { EmployeeCategory } from "@/lib/employee-categories";
import { normalizeRateType, type RateType } from "@/lib/rate-types";
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
import { getOtPayPercent } from "@/lib/actions/site-settings";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  calculatePayrollAmounts,
  derivePayrollRates,
} from "@/lib/payroll-calculations";

function mapEmployee(row: Record<string, unknown>): Employee {
  return {
    id: row.id as string,
    employeeNumber: (row.employee_number as string) ?? "",
    name: row.name as string,
    category: (row.category as EmployeeCategory) ?? "construction",
    designation: row.designation as Employee["designation"],
    rate: Number(row.rate),
    rateType: normalizeRateType(row.rate_type as string, row.category as EmployeeCategory),
    status: (row.status as "active" | "inactive") ?? "active",
    assignedSite: (row.assigned_site as string) || undefined,
  };
}

function mapPayrollRow(
  row: Record<string, unknown>,
  period: PayrollPeriod,
  category: EmployeeCategory,
  otPayPercent?: number
): PayrollEntry {
  const employee = row.employees as
    | {
        employee_number?: string;
        name: string;
        category: EmployeeCategory;
        designation?: string;
        rate?: number;
        rate_type?: string;
      }
    | null
    | undefined;
  const { dailyRate, hourlyRate } = derivePayrollRates(
    Number(employee?.rate) || 0,
    normalizeRateType(employee?.rate_type, employee?.category ?? category)
  );
  const hours = Number(row.hours) || 0;
  const overtimeHours = Number(row.overtime_hours) || 0;
  const calculated = calculatePayrollAmounts({
    hourlyRate,
    regularHours: hours,
    overtimeHours,
    otPayPercent,
    cashAdvance: Number(row.cash_advance) || 0,
    additionalPay: Number(row.additional_pay) || 0,
    statutoryDeductions: Number(row.deductions) || 0,
  });

  return {
    id: row.id as string,
    employeeId: row.employee_id as string,
    employeeNumber: employee?.employee_number ?? "",
    employeeName: employee?.name ?? "Unknown",
    siteAssignment: (row.site_assignment as string) ?? "",
    designation: employee?.designation ?? "",
    category: employee?.category ?? category,
    periodKey: period.key,
    period: period.label,
    dailyRate,
    hourlyRate,
    hours,
    overtimeHours,
    regularPay: Number(row.regular_pay) || calculated.regularPay,
    overtimePay: Number(row.overtime_pay) || calculated.overtimePay,
    grossPay: Number(row.gross_pay),
    cashAdvance: Number(row.cash_advance) || 0,
    additionalPay: Number(row.additional_pay) || 0,
    deductions: Number(row.deductions) || 0,
    netPay: Number(row.net_pay),
    disbursement: (row.disbursement as string) ?? "",
    remarks: (row.remarks as string) ?? "",
    chargedTo: (row.charged_to as string) ?? "",
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

  const { dailyRate, hourlyRate } = derivePayrollRates(
    employee.rate,
    employee.rateType
  );

  return {
    id: `preview-${employee.id}-${period.key}`,
    employeeId: employee.id,
    employeeNumber: employee.employeeNumber,
    employeeName: employee.name,
    siteAssignment: employee.assignedSite || "",
    designation: employee.designation,
    category: employee.category,
    periodKey: period.key,
    period: period.label,
    dailyRate,
    hourlyRate,
    hours: 0,
    overtimeHours: 0,
    regularPay: 0,
    overtimePay: 0,
    grossPay: 0,
    cashAdvance: 0,
    additionalPay: 0,
    deductions: 0,
    netPay: 0,
    disbursement: "",
    remarks: "",
    chargedTo: "",
    status: "draft",
  };
}

export async function getEmployees(): Promise<Employee[]> {
  if (!isSupabaseConfigured()) return mockEmployees;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("name");

    if (error) return [];
    return (data ?? []).map((row) => mapEmployee(row as Record<string, unknown>));
  } catch {
    return [];
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
      .select(
        "*, employees(employee_number, name, category, designation, rate, rate_type), payroll_runs!inner(period_start, period_end)"
      )
      .eq("payroll_runs.period_start", period.periodStart)
      .eq("payroll_runs.period_end", period.periodEnd);

    if (error) return null;

    const [employees, otPayPercent] = await Promise.all([
      getEmployees(),
      getOtPayPercent(),
    ]);
    const categoryEmployees = employees.filter(
      (e) => e.status === "active" && e.category === category
    );

    const rows = (data ?? []).filter((row: Record<string, unknown>) => {
      const employee = row.employees as { category?: EmployeeCategory } | null;
      return employee?.category === category;
    });

    const byEmployee = new Map(
      rows.map((row: Record<string, unknown>) => [
        row.employee_id as string,
        mapPayrollRow(row, period, category, otPayPercent),
      ])
    );

    return categoryEmployees.map((employee) => {
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
  const adjustments = await getPayrollAdjustments();
  const otPayPercent = await getOtPayPercent();

  return applyAttendanceToPayrollEntries(
    entries,
    employees,
    constructionRows,
    hourlyRows,
    category,
    adjustments,
    otPayPercent
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
  employee_number: string;
  name: string;
  category: EmployeeCategory;
  designation: string;
  rate: number;
  rate_type: RateType;
  assigned_site?: string;
}) {
  await requireAdmin();
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("employees")
      .insert({
        employee_number: input.employee_number,
        name: input.name,
        category: input.category,
        designation: input.designation,
        rate: input.rate,
        rate_type: input.rate_type,
        assigned_site: input.assigned_site || null,
        status: "active",
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    if (!data?.id) return { error: "Employee was not created." };

    revalidatePath("/admin/employees");
    revalidatePath("/admin");
    return { success: true, id: data.id as string };
  } catch {
    return { error: "Could not create employee." };
  }
}

export async function updateEmployee(
  id: string,
  input: {
    employee_number: string;
    name: string;
    category: EmployeeCategory;
    designation: string;
    rate: number;
    rate_type: RateType;
    status: "active" | "inactive";
    assigned_site?: string;
  }
) {
  await requireAdmin();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("employees").update(input).eq("id", id);
    if (error) return { error: error.message };
  } catch {
    return { error: "Could not update employee." };
  }

  revalidatePath("/admin/employees");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteEmployee(id: string) {
  await requireAdmin();
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) {
      if (
        error.code === "23503" ||
        /foreign key|referenced/i.test(error.message)
      ) {
        return {
          error:
            "This employee has payroll records. Set status to Inactive instead of deleting.",
        };
      }
      return { error: error.message };
    }
  } catch {
    return { error: "Could not delete employee." };
  }

  revalidatePath("/admin/employees");
  revalidatePath("/admin");
  revalidatePath("/admin/payroll");
  revalidatePath("/admin/attendance");
  return { success: true };
}

function periodFromPreviewKey(periodKey: string): PayrollPeriod {
  if (periodKey.startsWith("w-")) {
    return parsePayrollPeriodKey("construction", periodKey);
  }
  return parsePayrollPeriodKey("admin", periodKey);
}

type PayrollEntryInput = {
  hours: number;
  overtime_hours: number;
  regular_pay: number;
  overtime_pay: number;
  gross_pay: number;
  cash_advance: number;
  additional_pay: number;
  deductions: number;
  net_pay: number;
  site_assignment: string;
  disbursement: string;
  remarks: string;
  charged_to: string;
  status: "draft" | "processed";
};

async function upsertPayrollEntry(
  employeeId: string,
  period: PayrollPeriod,
  input: PayrollEntryInput
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();

  let payrollRunId: string | undefined;

  const { data: existingRun, error: runLookupError } = await supabase
    .from("payroll_runs")
    .select("id")
    .eq("period_start", period.periodStart)
    .eq("period_end", period.periodEnd)
    .maybeSingle();

  if (runLookupError) return { error: runLookupError.message };

  if (existingRun?.id) {
    payrollRunId = existingRun.id as string;
  } else {
    const { data: newRun, error: runInsertError } = await supabase
      .from("payroll_runs")
      .insert({
        period_start: period.periodStart,
        period_end: period.periodEnd,
        status: input.status,
      })
      .select("id")
      .single();

    if (runInsertError) return { error: runInsertError.message };
    payrollRunId = newRun?.id as string | undefined;
  }

  if (!payrollRunId) return { error: "Payroll run was not created." };

  const { data: existingPayslip, error: payslipLookupError } = await supabase
    .from("payslips")
    .select("id")
    .eq("payroll_run_id", payrollRunId)
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (payslipLookupError) return { error: payslipLookupError.message };

  if (existingPayslip?.id) {
    const { error } = await supabase
      .from("payslips")
      .update(input)
      .eq("id", existingPayslip.id);
    if (error) return { error: error.message };
    return { id: existingPayslip.id as string };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("payslips")
    .insert({
      payroll_run_id: payrollRunId,
      employee_id: employeeId,
      ...input,
    })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };
  return { id: inserted?.id as string | undefined };
}

export async function updatePayrollEntry(
  id: string,
  input: PayrollEntryInput
) {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return { success: true, preview: true };
  }

  if (isPreviewPayrollEntryId(id)) {
    const parsed = parsePreviewPayrollEntryId(id);
    if (!parsed || isPreviewEmployeeId(parsed.employeeId)) {
      return { success: true, preview: true };
    }

    try {
      const period = periodFromPreviewKey(parsed.periodKey);
      const result = await upsertPayrollEntry(parsed.employeeId, period, input);
      if (result.error) return { error: result.error };

      revalidatePath("/admin/payroll");
      revalidatePath("/admin");
      return { success: true, id: result.id };
    } catch {
      return { error: "Could not save payroll entry." };
    }
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("payslips").update(input).eq("id", id);
    if (error) return { error: error.message };
  } catch {
    return { error: "Could not update payroll entry." };
  }

  revalidatePath("/admin/payroll");
  revalidatePath("/admin");
  return { success: true };
}
