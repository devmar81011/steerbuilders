"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  normalizeEmployeeName,
  parseConstructionPayrollWorkbook,
  type ImportedPayrollRow,
  type ParsedMasterEmployee,
} from "@/lib/payroll-excel-import";
import type { PayrollPeriod } from "@/lib/payroll-periods";
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

async function upsertRunAndPayslip(
  supabase: Awaited<ReturnType<typeof createClient>>,
  employeeId: string,
  period: PayrollPeriod,
  row: ImportedPayrollRow
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

  const payload = {
    hours: row.hours,
    overtime_hours: row.overtimeHours,
    regular_pay: row.regularPay,
    overtime_pay: row.overtimePay,
    gross_pay: row.grossPay,
    cash_advance: row.cashAdvance,
    additional_pay: row.additionalPay,
    deductions: Math.max(0, row.grossPay + row.additionalPay - row.cashAdvance - row.netPay),
    net_pay: row.netPay,
    site_assignment: row.siteAssignment,
    disbursement: row.disbursement,
    remarks: row.remarks,
    charged_to: row.chargedTo,
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
      .update(payload)
      .eq("id", existingPayslip.id);
    if (error) return { error: error.message };
    return { runId: payrollRunId, payslipId: existingPayslip.id as string };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("payslips")
    .insert({
      payroll_run_id: payrollRunId,
      employee_id: employeeId,
      ...payload,
    })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };
  return { runId: payrollRunId, payslipId: inserted?.id as string | undefined };
}

function previewEntriesFromRows(
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

  // Import the first period sheet (typical weekly file has one active period tab).
  const sheet = parsed.sheets[0];

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      preview: true,
      periodKey: sheet.period.key,
      periodLabel: sheet.period.label,
      importedCount: sheet.rows.length,
      sheetName: sheet.sheetName,
      entries: previewEntriesFromRows(sheet.rows, sheet.period),
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

    // Sync master list first when present.
    const masterSource: ParsedMasterEmployee[] =
      parsed.masterEmployees.length > 0
        ? parsed.masterEmployees
        : sheet.rows.map((row) => ({
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

    let runId: string | undefined;
    let importedCount = 0;

    for (const row of sheet.rows) {
      const employee = await ensureConstructionEmployee(supabase, row, existingByName);
      if (employee.error || !employee.id) {
        return { error: employee.error || `Could not save ${row.employeeName}.` };
      }

      const saved = await upsertRunAndPayslip(
        supabase,
        employee.id,
        sheet.period,
        row
      );
      if (saved.error) return { error: saved.error };
      runId = saved.runId ?? runId;
      importedCount += 1;
    }

    // Optional history table — ignore if migration not applied yet.
    const { error: uploadInsertError } = await supabase
      .from("payroll_uploads")
      .insert({
        filename,
        sheet_name: sheet.sheetName,
        period_key: sheet.period.key,
        period_start: sheet.period.periodStart,
        period_end: sheet.period.periodEnd,
        period_label: sheet.period.label,
        row_count: importedCount,
        payroll_run_id: runId ?? null,
      });
    if (uploadInsertError) {
      console.warn("payroll_uploads insert skipped:", uploadInsertError.message);
    }

    revalidatePath("/admin/payroll");
    revalidatePath("/admin/employees");
    revalidatePath("/admin");

    const refreshed = await getPayrollForPeriod("construction", sheet.period.key);

    return {
      success: true,
      periodKey: sheet.period.key,
      periodLabel: sheet.period.label,
      importedCount,
      sheetName: sheet.sheetName,
      entries: refreshed.entries.filter((entry) => entry.status === "processed"),
    };
  } catch {
    return { error: "Could not import payroll Excel." };
  }
}

async function historyFromPayrollRuns(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<PayrollUploadHistoryItem[]> {
  const { data, error } = await supabase
    .from("payroll_runs")
    .select("id, period_start, period_end, status, created_at, payslips(id)")
    .order("period_start", { ascending: false })
    .limit(40);

  if (error || !data) return [];

  return data
    .map((row) => {
      const periodStart = String(row.period_start);
      const periodEnd = String(row.period_end);
      const payslips = (row.payslips as { id: string }[] | null) ?? [];
      if (!payslips.length) return null;

      const periodKey = `w-${periodStart}`;
      const labelDate = new Date(`${periodStart}T00:00:00`);
      const periodLabel = Number.isNaN(labelDate.getTime())
        ? `${periodStart} – ${periodEnd}`
        : `Week of ${labelDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}`;

      return {
        id: String(row.id),
        filename: "Saved payroll",
        sheetName: "",
        periodKey,
        periodStart,
        periodEnd,
        periodLabel,
        rowCount: payslips.length,
        uploadedAt: String(row.created_at ?? periodStart),
      } satisfies PayrollUploadHistoryItem;
    })
    .filter((item): item is PayrollUploadHistoryItem => item !== null);
}

export async function getPayrollUploadHistory(): Promise<PayrollUploadHistoryItem[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();

    // Prefer dedicated upload log when migration 028 is applied.
    const { data, error } = await supabase
      .from("payroll_uploads")
      .select("*")
      .order("uploaded_at", { ascending: false })
      .limit(40);

    if (!error && data) {
      return data.map((row) => ({
        id: row.id as string,
        filename: row.filename as string,
        sheetName: (row.sheet_name as string) ?? "",
        periodKey: row.period_key as string,
        periodStart: row.period_start as string,
        periodEnd: row.period_end as string,
        periodLabel: row.period_label as string,
        rowCount: Number(row.row_count) || 0,
        uploadedAt: row.uploaded_at as string,
      }));
    }

    // Fallback: list weeks that already have saved payslips.
    return historyFromPayrollRuns(supabase);
  } catch {
    return [];
  }
}
