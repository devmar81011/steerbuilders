import { normalizeTime24 } from "@/lib/time-format";

export type AttendanceDayKey =
  | "sun"
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat";

export const ATTENDANCE_DAYS: { key: AttendanceDayKey; label: string }[] = [
  { key: "sun", label: "Sun" },
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
];

export const DEFAULT_ATTENDANCE: Record<AttendanceDayKey, boolean> = {
  sun: false,
  mon: true,
  tue: true,
  wed: true,
  thu: true,
  fri: true,
  sat: true,
};

export type AttendanceRow = {
  id: string | null;
  employeeId: string;
  employeeName: string;
  weekStart: string;
  sun: boolean;
  mon: boolean;
  tue: boolean;
  wed: boolean;
  thu: boolean;
  fri: boolean;
  sat: boolean;
};

export type DayTimeEntry = {
  timeIn: string;
  timeOut: string;
};

export type AdminAttendanceRow = {
  id: string | null;
  employeeId: string;
  employeeName: string;
  weekStart: string;
  sun: DayTimeEntry;
  mon: DayTimeEntry;
  tue: DayTimeEntry;
  wed: DayTimeEntry;
  thu: DayTimeEntry;
  fri: DayTimeEntry;
  sat: DayTimeEntry;
};

export type AdminTimeField = "timeIn" | "timeOut";

const EMPTY_DAY_DEFAULT: DayTimeEntry = { timeIn: "00:00", timeOut: "00:00" };

export const DEFAULT_ADMIN_TIMES: Record<AttendanceDayKey, DayTimeEntry> = {
  sun: EMPTY_DAY_DEFAULT,
  mon: EMPTY_DAY_DEFAULT,
  tue: EMPTY_DAY_DEFAULT,
  wed: EMPTY_DAY_DEFAULT,
  thu: EMPTY_DAY_DEFAULT,
  fri: EMPTY_DAY_DEFAULT,
  sat: EMPTY_DAY_DEFAULT,
};

export type AttendanceTab = "construction" | "admin" | "ojt";

export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateISO(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Returns the Sunday that starts the week containing `date`. */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return formatDateISO(d);
}

export function shiftWeekStart(weekStart: string, weeks: number): string {
  const d = parseDateISO(weekStart);
  d.setDate(d.getDate() + weeks * 7);
  return formatDateISO(d);
}

export function formatWeekRange(weekStart: string): string {
  const start = parseDateISO(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const sameMonth = start.getMonth() === end.getMonth();
  const startFmt = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endFmt = end.toLocaleDateString("en-US", {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startFmt} – ${endFmt}`;
}

export function createDefaultAttendanceRow(
  employeeId: string,
  employeeName: string,
  weekStart: string,
  id: string | null = null
): AttendanceRow {
  return {
    id,
    employeeId,
    employeeName,
    weekStart,
    ...DEFAULT_ATTENDANCE,
  };
}

export function createDefaultAdminAttendanceRow(
  employeeId: string,
  employeeName: string,
  weekStart: string,
  id: string | null = null
): AdminAttendanceRow {
  return {
    id,
    employeeId,
    employeeName,
    weekStart,
    ...DEFAULT_ADMIN_TIMES,
  };
}

export function countPresentDays(row: AttendanceRow): number {
  return ATTENDANCE_DAYS.reduce(
    (total, { key }) => total + (row[key] ? 1 : 0),
    0
  );
}

export function setDayValue(
  row: AttendanceRow,
  dayKey: AttendanceDayKey,
  present: boolean
): AttendanceRow {
  return { ...row, [dayKey]: present };
}

export function setAdminDayTime(
  row: AdminAttendanceRow,
  dayKey: AttendanceDayKey,
  field: AdminTimeField,
  value: string
): AdminAttendanceRow {
  return {
    ...row,
    [dayKey]: { ...row[dayKey], [field]: value },
  };
}

export function adminDayTimesFromRecord(
  times: Partial<Record<AttendanceDayKey, DayTimeEntry>> | null | undefined
): Record<AttendanceDayKey, DayTimeEntry> {
  const result = { ...DEFAULT_ADMIN_TIMES };
  if (!times) return result;

  for (const { key } of ATTENDANCE_DAYS) {
    const entry = times[key];
    if (entry) {
      result[key] = {
        timeIn: normalizeTime24(entry.timeIn ?? "00:00"),
        timeOut: normalizeTime24(entry.timeOut ?? "00:00"),
      };
    }
  }
  return result;
}

export function adminRowToTimesRecord(
  row: AdminAttendanceRow
): Record<AttendanceDayKey, DayTimeEntry> {
  return {
    sun: row.sun,
    mon: row.mon,
    tue: row.tue,
    wed: row.wed,
    thu: row.thu,
    fri: row.fri,
    sat: row.sat,
  };
}

function parseTimeToMinutes(value: string): number | null {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

export function calculateDayHours(entry: DayTimeEntry): number {
  const start = parseTimeToMinutes(entry.timeIn);
  const end = parseTimeToMinutes(entry.timeOut);
  if (start == null || end == null || end <= start) return 0;
  return (end - start) / 60;
}

export function countAdminHours(row: AdminAttendanceRow): number {
  return ATTENDANCE_DAYS.reduce(
    (total, { key }) => total + calculateDayHours(row[key]),
    0
  );
}

export function isAdminDayPresent(entry: DayTimeEntry): boolean {
  const timeIn = entry.timeIn?.trim();
  const timeOut = entry.timeOut?.trim();
  if (!timeIn || !timeOut) return false;
  if (timeIn === "00:00" && timeOut === "00:00") return false;
  return calculateDayHours(entry) > 0;
}

export function formatHours(hours: number): string {
  if (hours <= 0) return "0h";
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  if (minutes === 0) return `${whole}h`;
  return `${whole}h ${minutes}m`;
}
