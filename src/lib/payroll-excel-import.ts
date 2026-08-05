import * as XLSX from "xlsx";
import { formatDateISO } from "@/lib/attendance";
import { getWeeklyPayrollPeriod, type PayrollPeriod } from "@/lib/payroll-periods";

export type ImportedPayrollRow = {
  employeeName: string;
  siteAssignment: string;
  designation: string;
  dailyRate: number;
  hourlyRate: number;
  hours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  grossPay: number;
  cashAdvance: number;
  additionalPay: number;
  netPay: number;
  disbursement: string;
  remarks: string;
  chargedTo: string;
};

export type ParsedPayrollSheet = {
  sheetName: string;
  period: PayrollPeriod;
  rows: ImportedPayrollRow[];
};

export type ParsedMasterEmployee = {
  employeeName: string;
  siteAssignment: string;
  designation: string;
  dailyRate: number;
  hourlyRate: number;
};

const PERIOD_HEADER_ALIASES: Record<keyof ImportedPayrollRow, string[]> = {
  employeeName: ["employee name", "name"],
  siteAssignment: ["site assignment", "site"],
  designation: ["designation", "role"],
  dailyRate: ["daily rate"],
  hourlyRate: ["hourly rate"],
  hours: ["no. of hours", "no of hours", "regular hours", "hours"],
  overtimeHours: ["ot hours", "overtime hours"],
  regularPay: ["regular pay"],
  overtimePay: ["ot pay", "overtime pay"],
  grossPay: ["gross pay"],
  cashAdvance: ["cash advance"],
  additionalPay: ["additional pay"],
  netPay: ["net pay"],
  disbursement: ["bpi", "disbursement", "mlhuillier", "mlhuilier"],
  remarks: ["remarks"],
  chargedTo: ["charged to?", "charged to"],
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
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

/**
 * Parse sheet names like "7.3.26" (M.D.YY) into a weekly payroll period.
 * Sheet tab = when the Excel was entered (any day). Period = Saturday of that week.
 * Example: 7.3.26 (Fri) → July 4, 2026 (Sat), range Mon Jun 29 – Sun Jul 5.
 */
export function periodFromSheetName(
  sheetName: string,
  fallbackDate: Date = new Date()
): PayrollPeriod {
  const match = sheetName.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (!match) {
    return getWeeklyPayrollPeriod(formatDateISO(fallbackDate));
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) year += 2000;

  const sheetDate = new Date(year, month - 1, day);
  if (Number.isNaN(sheetDate.getTime())) {
    return getWeeklyPayrollPeriod(formatDateISO(fallbackDate));
  }

  return getWeeklyPayrollPeriod(formatDateISO(sheetDate));
}

function buildHeaderMap(headerRow: unknown[]): Map<keyof ImportedPayrollRow, number> {
  const normalized = headerRow.map(normalizeHeader);
  const map = new Map<keyof ImportedPayrollRow, number>();

  for (const [field, aliases] of Object.entries(PERIOD_HEADER_ALIASES) as [
    keyof ImportedPayrollRow,
    string[],
  ][]) {
    const index = normalized.findIndex((header) => aliases.includes(header));
    if (index >= 0) map.set(field, index);
  }

  return map;
}

function rowLooksLikePayroll(headerMap: Map<keyof ImportedPayrollRow, number>) {
  return (
    headerMap.has("employeeName") &&
    (headerMap.has("netPay") ||
      headerMap.has("grossPay") ||
      headerMap.has("hours") ||
      headerMap.has("hourlyRate"))
  );
}

function parsePayrollRows(
  matrix: unknown[][],
  headerMap: Map<keyof ImportedPayrollRow, number>
): ImportedPayrollRow[] {
  const rows: ImportedPayrollRow[] = [];

  for (let i = 1; i < matrix.length; i += 1) {
    const raw = matrix[i] ?? [];
    const employeeName = toText(raw[headerMap.get("employeeName") ?? -1]);
    if (!employeeName) continue;

    const dailyRate = toNumber(raw[headerMap.get("dailyRate") ?? -1]);
    let hourlyRate = toNumber(raw[headerMap.get("hourlyRate") ?? -1]);
    if (!hourlyRate && dailyRate) hourlyRate = dailyRate / 8;

    const hours = toNumber(raw[headerMap.get("hours") ?? -1]);
    const overtimeHours = toNumber(raw[headerMap.get("overtimeHours") ?? -1]);
    // Pass-through Excel money columns when present. Only derive from
    // hours×rate if that column header is missing from the sheet.
    const regularPay = headerMap.has("regularPay")
      ? toNumber(raw[headerMap.get("regularPay") ?? -1])
      : hourlyRate * hours;
    const overtimePay = headerMap.has("overtimePay")
      ? toNumber(raw[headerMap.get("overtimePay") ?? -1])
      : hourlyRate * overtimeHours;
    const grossPay = headerMap.has("grossPay")
      ? toNumber(raw[headerMap.get("grossPay") ?? -1])
      : regularPay + overtimePay;
    const cashAdvance = toNumber(raw[headerMap.get("cashAdvance") ?? -1]);
    const additionalPay = toNumber(raw[headerMap.get("additionalPay") ?? -1]);
    const netPay = headerMap.has("netPay")
      ? toNumber(raw[headerMap.get("netPay") ?? -1])
      : grossPay - cashAdvance + additionalPay;

    rows.push({
      employeeName,
      siteAssignment: toText(raw[headerMap.get("siteAssignment") ?? -1]),
      designation: toText(raw[headerMap.get("designation") ?? -1]) || "Labor",
      dailyRate,
      hourlyRate,
      hours,
      overtimeHours,
      regularPay,
      overtimePay,
      grossPay,
      cashAdvance,
      additionalPay,
      netPay,
      disbursement: toText(raw[headerMap.get("disbursement") ?? -1]),
      remarks: toText(raw[headerMap.get("remarks") ?? -1]),
      chargedTo: toText(raw[headerMap.get("chargedTo") ?? -1]),
    });
  }

  return rows;
}

function parseMasterRows(matrix: unknown[][]): ParsedMasterEmployee[] {
  if (!matrix.length) return [];
  const headers = matrix[0].map(normalizeHeader);
  const nameIdx = headers.findIndex((h) => h === "employee name" || h === "name");
  if (nameIdx < 0) return [];

  const siteIdx = headers.findIndex((h) => h.includes("site"));
  const designationIdx = headers.findIndex(
    (h) => h === "designation" || h === "role"
  );
  const dailyIdx = headers.findIndex((h) => h === "daily rate");
  const hourlyIdx = headers.findIndex((h) => h === "hourly rate");

  const rows: ParsedMasterEmployee[] = [];
  for (let i = 1; i < matrix.length; i += 1) {
    const raw = matrix[i] ?? [];
    const employeeName = toText(raw[nameIdx]);
    if (!employeeName) continue;
    const dailyRate = toNumber(raw[dailyIdx]);
    let hourlyRate = toNumber(raw[hourlyIdx]);
    if (!hourlyRate && dailyRate) hourlyRate = dailyRate / 8;

    rows.push({
      employeeName,
      siteAssignment: siteIdx >= 0 ? toText(raw[siteIdx]) : "",
      designation:
        designationIdx >= 0 ? toText(raw[designationIdx]) || "Labor" : "Labor",
      dailyRate,
      hourlyRate,
    });
  }
  return rows;
}

export function parseConstructionPayrollWorkbook(buffer: ArrayBuffer): {
  sheets: ParsedPayrollSheet[];
  masterEmployees: ParsedMasterEmployee[];
} {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheets: ParsedPayrollSheet[] = [];
  let masterEmployees: ParsedMasterEmployee[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: null,
      raw: true,
    });

    if (!matrix.length) continue;

    if (normalizeHeader(sheetName) === "list") {
      masterEmployees = parseMasterRows(matrix);
      continue;
    }

    const headerMap = buildHeaderMap(matrix[0] ?? []);
    if (!rowLooksLikePayroll(headerMap)) continue;

    const rows = parsePayrollRows(matrix, headerMap);
    if (!rows.length) continue;

    sheets.push({
      sheetName,
      period: periodFromSheetName(sheetName),
      rows,
    });
  }

  return { sheets, masterEmployees };
}

export function normalizeEmployeeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
