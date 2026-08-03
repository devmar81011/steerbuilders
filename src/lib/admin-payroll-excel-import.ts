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
  phic: number;
  hdmf: number;
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
  phic: number;
  hdmf: number;
  tax: number;
  leavePay: number;
  basicPay: number;
  periodCode: string;
};

const META_PREFIX = "__ADMIN_META__:";

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
  const sssIdx = colIndex(headers, "sss");
  const phicIdx = colIndex(headers, "phic");
  const hdmfIdx = colIndex(headers, "hdmf");
  const basicIdx = colIndex(headers, "basic pay");
  const caIdx = colIndex(headers, "ca");
  const daysIdx = colIndex(headers, "payable days");
  const dailyIdx = colIndex(headers, "daily rate");

  // Employee share SSS/PHIC/HDMF are the first occurrence columns (10-12).
  // Employer share duplicates names later — colIndex already picks first.

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
      phic: toNumber(raw[phicIdx]),
      hdmf: toNumber(raw[hdmfIdx]),
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
  const statutory = row.sss + row.phic + row.hdmf + row.tax;
  const regularPay = Math.max(0, row.grossPay - row.overtimePay);
  const hours =
    row.payableDays > 0 ? row.payableDays * 8 : row.dailyRate > 0 ? regularPay / (row.dailyRate / 8 || 1) : 0;

  return {
    hours: Number.isFinite(hours) ? Math.round(hours * 100) / 100 : 0,
    overtimeHours: 0,
    regularPay,
    overtimePay: row.overtimePay,
    grossPay: row.grossPay,
    cashAdvance: row.cashAdvance,
    additionalPay: row.leavePay,
    deductions: statutory,
    netPay: row.netPay,
    dailyRate: row.dailyRate || (row.basicPay ? row.basicPay / 13 : 0),
    hourlyRate:
      row.dailyRate > 0
        ? row.dailyRate / 8
        : row.basicPay > 0
          ? row.basicPay / 13 / 8
          : 0,
    meta: {
      sss: row.sss,
      phic: row.phic,
      hdmf: row.hdmf,
      tax: row.tax,
      leavePay: row.leavePay,
      basicPay: row.basicPay,
      periodCode: row.periodCode,
    } satisfies AdminPayslipMeta,
  };
}
