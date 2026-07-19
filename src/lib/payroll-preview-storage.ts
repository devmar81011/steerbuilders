import type { PayrollEntry } from "@/lib/mvp-data";

const STORAGE_KEY = "sbc-payroll-preview";

type PayrollPreviewStore = Record<string, PayrollEntry>;

function readStore(): PayrollPreviewStore {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PayrollPreviewStore;
  } catch {
    return {};
  }
}

function writeStore(store: PayrollPreviewStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function savePayrollEntryPreview(entry: PayrollEntry) {
  const store = readStore();
  store[entry.id] = entry;
  writeStore(store);
}

export function mergePayrollEntriesWithPreview(
  entries: PayrollEntry[]
): PayrollEntry[] {
  const store = readStore();
  return entries.map((entry) => {
    const saved = store[entry.id];
    if (!saved) return entry;
    const legacyConstructionHours =
      saved.category === "construction" &&
      saved.regularPay == null &&
      Number(saved.hours) <= 7
        ? Number(saved.hours) * 8
        : Number(saved.hours);
    return {
      ...entry,
      ...saved,
      id: entry.id,
      employeeId: entry.employeeId,
      employeeName: entry.employeeName,
      category: entry.category,
      periodKey: entry.periodKey,
      period: entry.period,
      employeeNumber: entry.employeeNumber,
      designation: entry.designation,
      dailyRate: entry.dailyRate,
      hourlyRate: entry.hourlyRate,
      siteAssignment: saved.siteAssignment ?? entry.siteAssignment ?? "",
      hours: legacyConstructionHours || 0,
      overtimeHours: saved.overtimeHours ?? entry.overtimeHours ?? 0,
      regularPay: saved.regularPay ?? saved.grossPay ?? entry.regularPay ?? 0,
      overtimePay: saved.overtimePay ?? entry.overtimePay ?? 0,
      cashAdvance: saved.cashAdvance ?? 0,
      additionalPay: saved.additionalPay ?? 0,
      disbursement: saved.disbursement ?? "",
      remarks: saved.remarks ?? "",
      chargedTo: saved.chargedTo ?? "",
    };
  });
}
