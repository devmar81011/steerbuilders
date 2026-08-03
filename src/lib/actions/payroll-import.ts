"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  adminRowToPayslipAmounts,
  encodeAdminPayslipMeta,
  parseAdminPayrollWorkbook,
  type ImportedAdminPayrollRow,
} from "@/lib/admin-payroll-excel-import";
import {
  normalizeEmployeeName,
  parseConstructionPayrollWorkbook,
  type ImportedPayrollRow,
  type ParsedMasterEmployee,
} from "@/lib/payroll-excel-import";
import {
  getSemiMonthlyPayrollPeriod,
  getWeeklyPayrollPeriod,
  type PayrollPeriod,
} from "@/lib/payroll-periods";
import type { EmployeeCategory } from "@/lib/employee-categories";
import type { PayrollEntry } from "@/lib/mvp-data";
import { getPayrollForPeriod } from "@/lib/actions/payroll";

export type PayrollUploadHistoryItem = {
  id: string;
  filename: string;
  sheetName: string;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  rowCount: number;
  uploadedAt: string;
  category: EmployeeCategory;
};

async function ensureConstructionEmployee(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: Pick<
    ImportedPayrollRow,
    "employeeName" | "siteAssignment" | "designation" | "hourlyRate" | "dailyRate"
  >,
  existingByName: Map<string, { id: string; name: string }>
): Promise<{ id: string; error?: string }> {
  const key = normalizeEmployeeName(row.employeeName);
  const existing = existingByName.get(key);
  if (existing) {
    await supabase
      .from("employees")
      .update({
        designation: row.designation || "Labor",
        rate: row.hourlyRate || (row.dailyRate ? row.dailyRate / 8 : 0),
        rate_type: "hourly",
        assigned_site: row.siteAssignment || null,
        category: "construction",
        status: "active",
      })
      .eq("id", existing.id);
    return { id: existing.id };
  }

  const { data, error } = await supabase
    .from("employees")
    .insert({
      employee_number: "",
      name: row.employeeName,
      category: "construction",
      designation: row.designation || "Labor",
      rate: row.hourlyRate || (row.dailyRate ? row.dailyRate / 8 : 0),
      rate_type: "hourly",
      assigned_site: row.siteAssignment || null,
      status: "active",
    })
    .select("id, name")
    .single();

  if (error || !data?.id) {
    return { id: "", error: error?.message || "Could not create employee." };
  }

  existingByName.set(key, { id: data.id as string, name: data.name as string });
  return { id: data.id as string };
}

function mapAdminDesignation(employeeClass: string, status: string): string {
  const source = `${employeeClass} ${status}`.toLowerCase();
  if (source.includes("finance") || source.includes("admin") || source.includes("ma")) {
    return "Finance/Admin";
  }
  return "Operations";
}

async function ensureAdminEmployee(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: ImportedAdminPayrollRow,
  existingByName: Map<string, { id: string; name: string }>
): Promise<{ id: string; error?: string }> {
  const key = normalizeEmployeeName(row.employeeName);
  const amounts = adminRowToPayslipAmounts(row);
  const rate =
    amounts.hourlyRate ||
    (row.basicPay > 0 ? row.basicPay / 13 / 8 : 0);
  const designation = mapAdminDesignation(row.employeeClass, row.status);
  const existing = existingByName.get(key);

  if (existing) {
    await supabase
      .from("employees")
      .update({
        designation,
        rate,
        rate_type: "hourly",
        category: "admin",
        status: "active",
        basic_pay: row.basicPay || null,
      })
      .eq("id", existing.id);
    return { id: existing.id };
  }

  const { data, error } = await supabase
    .from("employees")
    .insert({
      employee_number: "",
      name: row.employeeName,
      category: "admin",
      designation,
      rate,
      rate_type: "hourly",
      basic_pay: row.basicPay || null,
      status: "active",
    })
    .select("id, name")
    .single();

  if (error || !data?.id) {
    return { id: "", error: error?.message || "Could not create employee." };
  }

  existingByName.set(key, { id: data.id as string, name: data.name as string });
  return { id: data.id as string };
}

async function upsertRunAndPayslip(
  supabase: Awaited<ReturnType<typeof createClient>>,
  employeeId: string,
  period: PayrollPeriod,
  payload: {
    hours: number;
    overtime_hours: number;
    regular_pay: number;
    overtime_pay: number;
    gross_pay: number;
    cash_advance: number;
    additional_pay: number;
    deductions: number;
    net_pay: number;
    site_assignment?: string;
    disbursement?: string;
    remarks?: string;
    charged_to?: string;
  }
): Promise<{ error?: string; runId?: string; payslipId?: string }> {
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
    await supabase
      .from("payroll_runs")
      .update({ status: "processed" })
      .eq("id", payrollRunId);
  } else {
    const { data: newRun, error: runInsertError } = await supabase
      .from("payroll_runs")
      .insert({
        period_start: period.periodStart,
        period_end: period.periodEnd,
        status: "processed",
      })
      .select("id")
      .single();
    if (runInsertError) return { error: runInsertError.message };
    payrollRunId = newRun?.id as string | undefined;
  }

  if (!payrollRunId) return { error: "Payroll run was not created." };

  const payslipPayload = {
    ...payload,
    status: "processed" as const,
  };

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
      .update(payslipPayload)
      .eq("id", existingPayslip.id);
    if (error) return { error: error.message };
    return { runId: payrollRunId, payslipId: existingPayslip.id as string };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("payslips")
    .insert({
      payroll_run_id: payrollRunId,
      employee_id: employeeId,
      ...payslipPayload,
    })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };
  return { runId: payrollRunId, payslipId: inserted?.id as string | undefined };
}

async function recordUpload(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    filename: string;
    sheetName: string;
    period: PayrollPeriod;
    rowCount: number;
    runId?: string;
    category: EmployeeCategory;
  }
) {
  const { error } = await supabase.from("payroll_uploads").insert({
    filename: input.filename,
    sheet_name: input.sheetName,
    period_key: input.period.key,
    period_start: input.period.periodStart,
    period_end: input.period.periodEnd,
    period_label: input.period.label,
    row_count: input.rowCount,
    payroll_run_id: input.runId ?? null,
    category: input.category,
  });
  if (error) {
    // Older schemas may not have category yet — retry without it.
    if (error.message.toLowerCase().includes("category")) {
      const retry = await supabase.from("payroll_uploads").insert({
        filename: input.filename,
        sheet_name: input.sheetName,
        period_key: input.period.key,
        period_start: input.period.periodStart,
        period_end: input.period.periodEnd,
        period_label: input.period.label,
        row_count: input.rowCount,
        payroll_run_id: input.runId ?? null,
      });
      if (retry.error) {
        console.warn("payroll_uploads insert skipped:", retry.error.message);
      }
      return;
    }
    console.warn("payroll_uploads insert skipped:", error.message);
  }
}

function categoryFromPeriodKey(periodKey: string): EmployeeCategory {
  return periodKey.startsWith("s-") ? "admin" : "construction";
}

function previewEntriesFromConstructionRows(
  rows: ImportedPayrollRow[],
  period: PayrollPeriod
): PayrollEntry[] {
  return rows.map((row, index) => ({
    id: `preview-import-${period.key}-${index}`,
    employeeId: `preview-emp-${normalizeEmployeeName(row.employeeName)}`,
    employeeNumber: "",
    employeeName: row.employeeName,
    siteAssignment: row.siteAssignment,
    designation: row.designation,
    category: "construction" as const,
    periodKey: period.key,
    period: period.label,
    dailyRate: row.dailyRate,
    hourlyRate: row.hourlyRate,
    hours: row.hours,
    overtimeHours: row.overtimeHours,
    regularPay: row.regularPay,
    overtimePay: row.overtimePay,
    grossPay: row.grossPay,
    cashAdvance: row.cashAdvance,
    additionalPay: row.additionalPay,
    deductions: Math.max(
      0,
      row.grossPay + row.additionalPay - row.cashAdvance - row.netPay
    ),
    netPay: row.netPay,
    disbursement: row.disbursement,
    remarks: row.remarks,
    chargedTo: row.chargedTo,
    status: "processed" as const,
  }));
}

function previewEntriesFromAdminRows(
  rows: ImportedAdminPayrollRow[],
  period: PayrollPeriod
): PayrollEntry[] {
  return rows.map((row, index) => {
    const amounts = adminRowToPayslipAmounts(row);
    return {
      id: `preview-admin-${period.key}-${index}`,
      employeeId: `preview-emp-${normalizeEmployeeName(row.employeeName)}`,
      employeeNumber: "",
      employeeName: row.employeeName,
      siteAssignment: "",
      designation: mapAdminDesignation(row.employeeClass, row.status),
      category: "admin" as const,
      periodKey: period.key,
      period: period.label,
      dailyRate: amounts.dailyRate,
      hourlyRate: amounts.hourlyRate,
      hours: amounts.hours,
      overtimeHours: amounts.overtimeHours,
      regularPay: amounts.regularPay,
      overtimePay: amounts.overtimePay,
      grossPay: amounts.grossPay,
      cashAdvance: amounts.cashAdvance,
      additionalPay: amounts.additionalPay,
      deductions: amounts.deductions,
      deductionBreakdown: [
        { code: "sss", label: "SSS", amount: amounts.meta.sss },
        { code: "phic", label: "PhilHealth", amount: amounts.meta.phic },
        { code: "hdmf", label: "HDMF", amount: amounts.meta.hdmf },
        { code: "tax", label: "Tax", amount: amounts.meta.tax },
      ],
      netPay: amounts.netPay,
      disbursement: "",
      remarks: encodeAdminPayslipMeta(amounts.meta),
      chargedTo: "",
      status: "processed" as const,
    };
  });
}

export async function importConstructionPayrollExcel(formData: FormData): Promise<{
  error?: string;
  success?: boolean;
  preview?: boolean;
  periodKey?: string;
  periodLabel?: string;
  importedCount?: number;
  sheetName?: string;
  entries?: PayrollEntry[];
}> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Choose an Excel (.xlsx) payroll file to upload." };
  }

  const filename = file.name || "payroll.xlsx";
  if (!/\.xlsx?$/i.test(filename)) {
    return { error: "Upload an .xlsx Excel file." };
  }

  const buffer = await file.arrayBuffer();
  let parsed;
  try {
    parsed = parseConstructionPayrollWorkbook(buffer);
  } catch {
    return { error: "Could not read that Excel file. Check the format and try again." };
  }

  if (!parsed.sheets.length) {
    return {
      error:
        "No payroll sheet found. Use a period sheet like your Operations payroll file (not only the List sheet).",
    };
  }

  const sheets = parsed.sheets;
  const primarySheet = sheets[sheets.length - 1] ?? sheets[0];

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      preview: true,
      periodKey: primarySheet.period.key,
      periodLabel: primarySheet.period.label,
      importedCount: sheets.reduce((sum, sheet) => sum + sheet.rows.length, 0),
      sheetName: sheets.map((sheet) => sheet.sheetName).join(", "),
      entries: previewEntriesFromConstructionRows(
        primarySheet.rows,
        primarySheet.period
      ),
    };
  }

  try {
    const supabase = await createClient();

    const { data: existingEmployees, error: employeeError } = await supabase
      .from("employees")
      .select("id, name")
      .eq("category", "construction");

    if (employeeError) return { error: employeeError.message };

    const existingByName = new Map(
      (existingEmployees ?? []).map((row) => [
        normalizeEmployeeName(String(row.name)),
        { id: row.id as string, name: String(row.name) },
      ])
    );

    const masterSource: ParsedMasterEmployee[] =
      parsed.masterEmployees.length > 0
        ? parsed.masterEmployees
        : primarySheet.rows.map((row) => ({
            employeeName: row.employeeName,
            siteAssignment: row.siteAssignment,
            designation: row.designation,
            dailyRate: row.dailyRate,
            hourlyRate: row.hourlyRate,
          }));

    for (const master of masterSource) {
      const result = await ensureConstructionEmployee(supabase, master, existingByName);
      if (result.error) return { error: result.error };
    }

    let totalImported = 0;
    const sheetNames: string[] = [];

    for (const sheet of sheets) {
      let sheetImported = 0;
      let runId: string | undefined;

      for (const row of sheet.rows) {
        const employee = await ensureConstructionEmployee(supabase, row, existingByName);
        if (employee.error || !employee.id) {
          return { error: employee.error || `Could not save ${row.employeeName}.` };
        }

        const saved = await upsertRunAndPayslip(supabase, employee.id, sheet.period, {
          hours: row.hours,
          overtime_hours: row.overtimeHours,
          regular_pay: row.regularPay,
          overtime_pay: row.overtimePay,
          gross_pay: row.grossPay,
          cash_advance: row.cashAdvance,
          additional_pay: row.additionalPay,
          deductions: Math.max(
            0,
            row.grossPay + row.additionalPay - row.cashAdvance - row.netPay
          ),
          net_pay: row.netPay,
          site_assignment: row.siteAssignment,
          disbursement: row.disbursement,
          remarks: row.remarks,
          charged_to: row.chargedTo,
        });
        if (saved.error) return { error: saved.error };
        runId = saved.runId ?? runId;
        sheetImported += 1;
      }

      totalImported += sheetImported;
      sheetNames.push(sheet.sheetName);

      await recordUpload(supabase, {
        filename,
        sheetName: sheet.sheetName,
        period: sheet.period,
        rowCount: sheetImported,
        runId,
        category: "construction",
      });
    }

    revalidatePath("/admin/payroll");
    revalidatePath("/admin/employees");
    revalidatePath("/admin");

    const refreshed = await getPayrollForPeriod("construction", primarySheet.period.key);

    return {
      success: true,
      periodKey: primarySheet.period.key,
      periodLabel:
        sheets.length > 1
          ? `${sheets.length} weeks imported · showing ${primarySheet.period.label}`
          : primarySheet.period.label,
      importedCount: totalImported,
      sheetName: sheetNames.join(", "),
      entries: refreshed.entries.filter((entry) => entry.status === "processed"),
    };
  } catch {
    return { error: "Could not import payroll Excel." };
  }
}

export async function importAdminPayrollExcel(formData: FormData): Promise<{
  error?: string;
  success?: boolean;
  preview?: boolean;
  periodKey?: string;
  periodLabel?: string;
  importedCount?: number;
  sheetName?: string;
  entries?: PayrollEntry[];
}> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Choose an Excel (.xlsx) admin payroll file to upload." };
  }

  const filename = file.name || "admin-payroll.xlsx";
  if (!/\.xlsx?$/i.test(filename)) {
    return { error: "Upload an .xlsx Excel file." };
  }

  const buffer = await file.arrayBuffer();
  let parsed;
  try {
    parsed = parseAdminPayrollWorkbook(buffer);
  } catch {
    return {
      error: "Could not read that Excel file. Check the Admin payroll format and try again.",
    };
  }

  if (!parsed.periods.length) {
    return {
      error:
        'No admin payroll rows found. Use the workbook with a "Payroll Computation" sheet (period codes like jan2026a).',
    };
  }

  const primaryPeriod = parsed.periods[parsed.periods.length - 1]!;
  const primaryRows = parsed.rowsByPeriod.get(primaryPeriod.key) ?? [];

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      preview: true,
      periodKey: primaryPeriod.key,
      periodLabel: primaryPeriod.label,
      importedCount: [...parsed.rowsByPeriod.values()].reduce(
        (sum, rows) => sum + rows.length,
        0
      ),
      sheetName: "Payroll Computation",
      entries: previewEntriesFromAdminRows(primaryRows, primaryPeriod),
    };
  }

  try {
    const supabase = await createClient();

    const { data: existingEmployees, error: employeeError } = await supabase
      .from("employees")
      .select("id, name")
      .eq("category", "admin");

    if (employeeError) return { error: employeeError.message };

    const existingByName = new Map(
      (existingEmployees ?? []).map((row) => [
        normalizeEmployeeName(String(row.name)),
        { id: row.id as string, name: String(row.name) },
      ])
    );

    let totalImported = 0;

    for (const period of parsed.periods) {
      const rows = parsed.rowsByPeriod.get(period.key) ?? [];
      let runId: string | undefined;
      let sheetImported = 0;

      for (const row of rows) {
        const employee = await ensureAdminEmployee(supabase, row, existingByName);
        if (employee.error || !employee.id) {
          return { error: employee.error || `Could not save ${row.employeeName}.` };
        }

        const amounts = adminRowToPayslipAmounts(row);
        const saved = await upsertRunAndPayslip(supabase, employee.id, period, {
          hours: amounts.hours,
          overtime_hours: amounts.overtimeHours,
          regular_pay: amounts.regularPay,
          overtime_pay: amounts.overtimePay,
          gross_pay: amounts.grossPay,
          cash_advance: amounts.cashAdvance,
          additional_pay: amounts.additionalPay,
          deductions: amounts.deductions,
          net_pay: amounts.netPay,
          site_assignment: "",
          disbursement: "",
          remarks: encodeAdminPayslipMeta(amounts.meta),
          charged_to: "",
        });
        if (saved.error) return { error: saved.error };
        runId = saved.runId ?? runId;
        sheetImported += 1;
      }

      totalImported += sheetImported;
      await recordUpload(supabase, {
        filename,
        sheetName: "Payroll Computation",
        period,
        rowCount: sheetImported,
        runId,
        category: "admin",
      });
    }

    revalidatePath("/admin/payroll");
    revalidatePath("/admin/employees");
    revalidatePath("/admin");

    const refreshed = await getPayrollForPeriod("admin", primaryPeriod.key);

    return {
      success: true,
      periodKey: primaryPeriod.key,
      periodLabel:
        parsed.periods.length > 1
          ? `${parsed.periods.length} cutoffs imported · showing ${primaryPeriod.label}`
          : primaryPeriod.label,
      importedCount: totalImported,
      sheetName: "Payroll Computation",
      entries: refreshed.entries.filter((entry) => entry.status === "processed"),
    };
  } catch {
    return { error: "Could not import admin payroll Excel." };
  }
}

function historyItemFromRun(row: {
  id: unknown;
  period_start: unknown;
  period_end: unknown;
  created_at?: unknown;
  payslips?:
    | {
        id: string;
        employees?:
          | { category?: string }
          | { category?: string }[]
          | null;
      }[]
    | null;
}): PayrollUploadHistoryItem | null {
  const periodStart = String(row.period_start);
  const periodEnd = String(row.period_end);
  const payslips = row.payslips ?? [];
  if (!payslips.length) return null;

  const categories = payslips
    .map((slip) => {
      const employee = Array.isArray(slip.employees)
        ? slip.employees[0]
        : slip.employees;
      return employee?.category;
    })
    .filter((value): value is string => Boolean(value));
  const category: EmployeeCategory =
    categories.includes("admin") && !categories.includes("construction")
      ? "admin"
      : categories.includes("ojt") && !categories.includes("construction")
        ? "ojt"
        : "construction";

  const period =
    category === "construction"
      ? getWeeklyPayrollPeriod(periodStart)
      : (() => {
          const start = new Date(`${periodStart}T00:00:00`);
          const half = start.getDate() <= 15 ? 1 : 2;
          return getSemiMonthlyPayrollPeriod(
            start.getFullYear(),
            start.getMonth() + 1,
            half as 1 | 2
          );
        })();

  return {
    id: String(row.id),
    filename: "Saved payroll",
    sheetName: "",
    periodKey: period.key,
    periodStart,
    periodEnd,
    periodLabel: period.label,
    rowCount: payslips.length,
    uploadedAt: String(row.created_at ?? periodStart),
    category,
  };
}

async function historyFromPayrollRuns(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<PayrollUploadHistoryItem[]> {
  const { data, error } = await supabase
    .from("payroll_runs")
    .select(
      "id, period_start, period_end, status, created_at, payslips(id, employees(category))"
    )
    .order("period_start", { ascending: false })
    .limit(24);

  if (error || !data) return [];

  return data
    .map((row) => historyItemFromRun(row))
    .filter((item): item is PayrollUploadHistoryItem => item !== null)
    .slice(0, 12);
}

export async function getPayrollUploadHistory(
  category?: EmployeeCategory
): Promise<PayrollUploadHistoryItem[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("payroll_uploads")
      .select("*")
      .order("uploaded_at", { ascending: false })
      .limit(24);

    if (!error && data) {
      const mapped = data.map((row) => {
        const periodKey = row.period_key as string;
        const inferred = categoryFromPeriodKey(periodKey);
        return {
          id: row.id as string,
          filename: row.filename as string,
          sheetName: (row.sheet_name as string) ?? "",
          periodKey,
          periodStart: row.period_start as string,
          periodEnd: row.period_end as string,
          periodLabel: row.period_label as string,
          rowCount: Number(row.row_count) || 0,
          uploadedAt: row.uploaded_at as string,
          category: ((row.category as EmployeeCategory | undefined) ??
            inferred) as EmployeeCategory,
        } satisfies PayrollUploadHistoryItem;
      });

      return (category
        ? mapped.filter((item) => item.category === category)
        : mapped
      ).slice(0, 12);
    }

    const fallback = await historyFromPayrollRuns(supabase);
    return category ? fallback.filter((item) => item.category === category) : fallback;
  } catch {
    return [];
  }
}
