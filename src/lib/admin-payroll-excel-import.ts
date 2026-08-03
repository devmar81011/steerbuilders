import * as XLSX from "xlsx";
import {
  getSemiMonthlyPayrollPeriod,
  type PayrollPeriod,
  type PayrollPeriodHalf,
} from "@/lib/payroll-periods";

export type ImportedAdminPayrollRow = {
  employeeName: string;
  periodCode: string;
  period: PayrollPeriod;
  status: string;
  employeeClass: string;
  netPay: number;
  grossPay: number;
  overtimePay: number;
  leavePay: number;
  tax: number;
  sss: number;
  sssLoan: number;
  phic: number;
  hdmf: number;
  hdmfLoan: number;
  basicPay: number;
  cashAdvance: number;
  dailyRate: number;
  payableDays: number;
};

const MONTH_CODES: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

export type AdminPayslipMeta = {
  sss: number;
  sssLoan: number;
  phic: number;
  hdmf: number;
  hdmfLoan: number;
  tax: number;
  leavePay: number;
  basicPay: number;
  periodCode: string;
  /** Excel Status column — typically FTE or Intern */
  employmentStatus?: string;
};

const META_PREFIX = "__ADMIN_META__:";

/** Normalize Excel Status values to FTE / Intern when possible. */
export function normalizeAdminEmploymentStatus(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  const lower = value.toLowerCase();
  if (/\bintern\b|\bojt\b/.test(lower)) return "Intern";
  if (/\bfte\b|full[\s-]?time/.test(lower)) return "FTE";
  return value;
}

export function encodeAdminPayslipMeta(meta: AdminPayslipMeta): string {
  return `${META_PREFIX}${JSON.stringify(meta)}`;
}

export function parseAdminPayslipMeta(
  remarks: string | null | undefined
): AdminPayslipMeta | null {
  if (!remarks?.startsWith(META_PREFIX)) return null;
  try {
    return JSON.parse(remarks.slice(META_PREFIX.length)) as AdminPayslipMeta;
  } catch {
    return null;
  }
}

export function adminEmploymentStatusFromRemarks(
  remarks: string | null | undefined
): string {
  const meta = parseAdminPayslipMeta(remarks);
  return meta?.employmentStatus?.trim() || "";
}

export function periodFromAdminCode(code: string): PayrollPeriod | null {
  const match = code.trim().toLowerCase().match(/^([a-z]{3})(\d{4})([ab])$/);
  if (!match) return null;
  const month = MONTH_CODES[match[1]];
  if (!month) return null;
  const year = Number(match[2]);
  const half: PayrollPeriodHalf = match[3] === "a" ? 1 : 2;
  return getSemiMonthlyPayrollPeriod(year, month, half);
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[₱,\s]/g, "").trim();
    if (!cleaned) return 0;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function findHeaderRow(matrix: unknown[][]): number {
  for (let i = 0; i < Math.min(matrix.length, 20); i += 1) {
    const row = matrix[i] ?? [];
    const normalized = row.map((cell) => String(cell ?? "").trim().toLowerCase());
    if (
      normalized.includes("period") &&
      normalized.includes("net") &&
      normalized.includes("gross")
    ) {
      return i;
    }
  }
  return -1;
}

function colIndex(headers: string[], ...names: string[]): number {
  for (const name of names) {
    const idx = headers.findIndex((header) => header === name);
    if (idx >= 0) return idx;
  }
  return -1;
}

/**
 * Parse Steer Builders Admin payroll workbook.
 * Primary source: "Payroll Computation" sheet (semi-monthly rows).
 */
export function parseAdminPayrollWorkbook(buffer: ArrayBuffer): {
  rowsByPeriod: Map<string, ImportedAdminPayrollRow[]>;
  periods: PayrollPeriod[];
} {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName =
    workbook.SheetNames.find((name) =>
      name.trim().toLowerCase().includes("payroll computation")
    ) ?? workbook.SheetNames[0];

  const worksheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  const headerRowIndex = findHeaderRow(matrix);
  if (headerRowIndex < 0) {
    return { rowsByPeriod: new Map(), periods: [] };
  }

  const headers = (matrix[headerRowIndex] ?? []).map((cell, index) => {
    const text = String(cell ?? "").trim().toLowerCase();
    // Name column is often unlabeled between period and status.
    if (!text && index === 2) return "employee name";
    return text;
  });

  const periodIdx = colIndex(headers, "period");
  const nameIdx = colIndex(headers, "employee name", "name");
  const statusIdx = colIndex(headers, "status");
  const classIdx = colIndex(headers, "class");
  const netIdx = colIndex(headers, "net");
  const grossIdx = colIndex(headers, "gross");
  const otIdx = colIndex(headers, "ot");
  const leaveIdx = colIndex(headers, "leave");
  const taxIdx = colIndex(headers, "tax");
  // Verified against Admin.xlsx → Payroll Computation:
  // employee share is the FIRST SSS / PHIC / HDMF (before "Taxable income");
  // employer share repeats SSS / PHIC / HDMF later. Exact labels are "SSS","PHIC","HDMF","CA".
  // Payslip "SSS Cont" / "HDMF Cont" map to those employee-share columns.
  // SSS Loan / HDMF Loan are not present on Computation (stay 0 unless labeled columns exist).
  // Cutoff pattern in the file: A-period usually PHIC+HDMF; B-period usually SSS.
  const sssIdx = colIndex(headers, "sss cont", "sss");
  const sssLoanIdx = colIndex(headers, "sss loan");
  const phicIdx = colIndex(headers, "phic");
  const hdmfIdx = colIndex(headers, "hdmf cont", "hdmf");
  const hdmfLoanIdx = colIndex(headers, "hdmf loan");
  const basicIdx = colIndex(headers, "basic pay");
  const caIdx = colIndex(headers, "ca", "cash advance");
  const daysIdx = colIndex(headers, "payable days");
  const dailyIdx = colIndex(headers, "daily rate");

  // First matching SSS/PHIC/HDMF = employee share (employer duplicates come later).

  const rowsByPeriod = new Map<string, ImportedAdminPayrollRow[]>();
  const periodMap = new Map<string, PayrollPeriod>();

  for (let i = headerRowIndex + 1; i < matrix.length; i += 1) {
    const raw = matrix[i] ?? [];
    const periodCode = toText(raw[periodIdx]);
    const employeeName = toText(raw[nameIdx >= 0 ? nameIdx : 2]);
    if (!periodCode || !employeeName) continue;

    const period = periodFromAdminCode(periodCode);
    if (!period) continue;

    const row: ImportedAdminPayrollRow = {
      employeeName,
      periodCode,
      period,
      status: toText(raw[statusIdx]),
      employeeClass: toText(raw[classIdx]),
      netPay: toNumber(raw[netIdx]),
      grossPay: toNumber(raw[grossIdx]),
      overtimePay: toNumber(raw[otIdx]),
      leavePay: toNumber(raw[leaveIdx]),
      tax: toNumber(raw[taxIdx]),
      sss: toNumber(raw[sssIdx]),
      sssLoan: toNumber(raw[sssLoanIdx]),
      phic: toNumber(raw[phicIdx]),
      hdmf: toNumber(raw[hdmfIdx]),
      hdmfLoan: toNumber(raw[hdmfLoanIdx]),
      basicPay: toNumber(raw[basicIdx]),
      cashAdvance: toNumber(raw[caIdx]),
      dailyRate: toNumber(raw[dailyIdx]),
      payableDays: toNumber(raw[daysIdx]),
    };

    const list = rowsByPeriod.get(period.key) ?? [];
    list.push(row);
    rowsByPeriod.set(period.key, list);
    periodMap.set(period.key, period);
  }

  const periods = [...periodMap.values()].sort((a, b) =>
    a.periodStart.localeCompare(b.periodStart)
  );

  return { rowsByPeriod, periods };
}

export function adminRowToPayslipAmounts(row: ImportedAdminPayrollRow) {
  // Pass-through Payroll Computation values only — do not invent amounts.
  const employeeShare =
    row.sss + row.sssLoan + row.phic + row.hdmf + row.hdmfLoan + row.tax;

  return {
    hours: row.payableDays > 0 ? row.payableDays * 8 : 0,
    overtimeHours: 0,
    regularPay: row.basicPay,
    overtimePay: row.overtimePay,
    grossPay: row.grossPay,
    cashAdvance: row.cashAdvance,
    additionalPay: row.leavePay,
    deductions: employeeShare,
    netPay: row.netPay,
    dailyRate: row.dailyRate || 0,
    hourlyRate: row.dailyRate > 0 ? row.dailyRate / 8 : 0,
    meta: {
      sss: row.sss,
      sssLoan: row.sssLoan,
      phic: row.phic,
      hdmf: row.hdmf,
      hdmfLoan: row.hdmfLoan,
      tax: row.tax,
      leavePay: row.leavePay,
      basicPay: row.basicPay,
      periodCode: row.periodCode,
      employmentStatus: normalizeAdminEmploymentStatus(row.status),
    } satisfies AdminPayslipMeta,
  };
}
