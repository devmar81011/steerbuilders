import type { AdminAttendanceRow, AttendanceRow } from "@/lib/attendance";

const STORAGE_KEY = "sbc-attendance-preview";

type PreviewStore = {
  construction: Record<string, AttendanceRow>;
  admin: Record<string, AdminAttendanceRow>;
};

function readStore(): PreviewStore {
  if (typeof window === "undefined") {
    return { construction: {}, admin: {} };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { construction: {}, admin: {} };
    const parsed = JSON.parse(raw) as Partial<PreviewStore>;
    return {
      construction: parsed.construction ?? {},
      admin: parsed.admin ?? {},
    };
  } catch {
    return { construction: {}, admin: {} };
  }
}

function writeStore(store: PreviewStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function constructionKey(weekStart: string, employeeId: string) {
  return `${weekStart}:${employeeId}`;
}

function adminKey(weekStart: string, employeeId: string) {
  return `${weekStart}:${employeeId}`;
}

export function saveConstructionAttendanceRow(row: AttendanceRow) {
  const store = readStore();
  store.construction[constructionKey(row.weekStart, row.employeeId)] = row;
  writeStore(store);
}

export function saveAdminAttendanceRow(row: AdminAttendanceRow) {
  const store = readStore();
  store.admin[adminKey(row.weekStart, row.employeeId)] = row;
  writeStore(store);
}

export function loadConstructionAttendanceRows(
  weekStart: string,
  fallback: AttendanceRow[]
): AttendanceRow[] {
  const store = readStore();
  return fallback.map((row) => {
    const saved = store.construction[constructionKey(weekStart, row.employeeId)];
    return saved ? { ...saved, employeeName: row.employeeName } : row;
  });
}

export function loadAdminAttendanceRows(
  weekStart: string,
  fallback: AdminAttendanceRow[]
): AdminAttendanceRow[] {
  const store = readStore();
  return fallback.map((row) => {
    const saved = store.admin[adminKey(weekStart, row.employeeId)];
    return saved ? { ...saved, employeeName: row.employeeName } : row;
  });
}

export function loadPreviewConstructionForWeeks(weekStarts: string[]): AttendanceRow[] {
  const store = readStore();
  return weekStarts.flatMap((weekStart) =>
    Object.values(store.construction).filter((row) => row.weekStart === weekStart)
  );
}

export function loadPreviewAdminForWeeks(weekStarts: string[]): AdminAttendanceRow[] {
  const store = readStore();
  return weekStarts.flatMap((weekStart) =>
    Object.values(store.admin).filter((row) => row.weekStart === weekStart)
  );
}

export function mergeConstructionRowsWithPreview(
  weekStart: string,
  rows: AttendanceRow[]
): AttendanceRow[] {
  return loadConstructionAttendanceRows(weekStart, rows);
}

export function mergeAdminRowsWithPreview(
  weekStart: string,
  rows: AdminAttendanceRow[]
): AdminAttendanceRow[] {
  return loadAdminAttendanceRows(weekStart, rows);
}
