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
    return {
      ...entry,
      ...saved,
      id: entry.id,
      employeeId: entry.employeeId,
      employeeName: entry.employeeName,
      category: entry.category,
      periodKey: entry.periodKey,
      period: entry.period,
    };
  });
}
