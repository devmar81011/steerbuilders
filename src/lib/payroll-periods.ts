import type { EmployeeCategory } from "@/lib/employee-categories";
import { usesWeeklyPayroll } from "@/lib/employee-categories";
import { formatDateISO, getWeekStart, parseDateISO } from "@/lib/attendance";

export type PayrollTab = EmployeeCategory;

export type PayrollCadence = "weekly" | "semi-monthly";

export type PayrollPeriodHalf = 1 | 2;

export type PayrollPeriod = {
  key: string;
  cadence: PayrollCadence;
  periodStart: string;
  periodEnd: string;
  processDate: string;
  label: string;
  processLabel: string;
};

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatProcessDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildWeeklyKey(weekStart: string) {
  return `w-${weekStart}`;
}

function buildSemiMonthlyKey(year: number, month: number, half: PayrollPeriodHalf) {
  return `s-${year}-${String(month).padStart(2, "0")}-${half}`;
}

/** Saturday (pay day) of the Mon–Sun week containing `date`. */
function getWeekSaturday(date: Date): Date {
  const monday = parseDateISO(getWeekStart(date));
  const saturday = new Date(monday);
  saturday.setDate(saturday.getDate() + 5);
  return saturday;
}

/**
 * Construction weekly period — Monday to Sunday.
 * Pay day / label / key = Saturday of that week.
 * `anchorDateISO` may be any date in the week (e.g. Excel sheet tab entry date).
 */
export function getWeeklyPayrollPeriod(anchorDateISO: string): PayrollPeriod {
  const anchor = parseDateISO(anchorDateISO);
  const weekStart = getWeekStart(anchor);
  const start = parseDateISO(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  // Payroll is always Saturday of the week (sheet tabs are entry dates only).
  const saturday = getWeekSaturday(anchor);
  const saturdayISO = formatDateISO(saturday);

  return {
    key: buildWeeklyKey(saturdayISO),
    cadence: "weekly",
    periodStart: weekStart,
    periodEnd: formatDateISO(end),
    processDate: saturdayISO,
    label: formatProcessDate(saturday),
    processLabel: `Pay on ${formatProcessDate(saturday)}`,
  };
}

/** Admin semi-monthly period — pay on the 15th and last day of month. */
export function getSemiMonthlyPayrollPeriod(
  year: number,
  month: number,
  half: PayrollPeriodHalf
): PayrollPeriod {
  const periodStart =
    half === 1
      ? new Date(year, month - 1, 1)
      : new Date(year, month - 1, 16);

  const periodEnd =
    half === 1
      ? new Date(year, month - 1, 15)
      : new Date(year, month - 1, lastDayOfMonth(year, month));

  const processDate =
    half === 1
      ? new Date(year, month - 1, 15)
      : new Date(year, month - 1, lastDayOfMonth(year, month));

  const endYearSuffix =
    periodEnd.getFullYear() !== periodStart.getFullYear()
      ? `, ${periodEnd.getFullYear()}`
      : "";

  return {
    key: buildSemiMonthlyKey(year, month, half),
    cadence: "semi-monthly",
    periodStart: formatDateISO(periodStart),
    periodEnd: formatDateISO(periodEnd),
    processDate: formatDateISO(processDate),
    label: `${formatShortDate(periodStart)} – ${formatShortDate(periodEnd)}${endYearSuffix}`,
    processLabel: `Pay on ${formatProcessDate(processDate)}`,
  };
}

export function getPayrollPeriod(
  category: PayrollTab,
  year: number,
  month: number,
  half: PayrollPeriodHalf
): PayrollPeriod {
  if (category === "construction") {
    throw new Error("Use getWeeklyPayrollPeriod for construction payroll.");
  }
  return getSemiMonthlyPayrollPeriod(year, month, half);
}

export function getCurrentPayrollPeriod(
  category: PayrollTab,
  date: Date = new Date()
): PayrollPeriod {
  if (usesWeeklyPayroll(category)) {
    return getWeeklyPayrollPeriod(formatDateISO(date));
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const half: PayrollPeriodHalf = date.getDate() <= 15 ? 1 : 2;
  return getSemiMonthlyPayrollPeriod(year, month, half);
}

export function parsePayrollPeriodKey(
  category: PayrollTab,
  periodKey: string
): PayrollPeriod {
  if (usesWeeklyPayroll(category)) {
    const anchorDate = periodKey.startsWith("w-")
      ? periodKey.slice(2)
      : periodKey;
    return getWeeklyPayrollPeriod(anchorDate);
  }

  const parts = periodKey.startsWith("s-")
    ? periodKey.slice(2).split("-")
    : periodKey.split("-");

  const [year, month, half] = parts;
  return getSemiMonthlyPayrollPeriod(
    Number(year),
    Number(month),
    Number(half) as PayrollPeriodHalf
  );
}

export function shiftPayrollPeriod(
  category: PayrollTab,
  period: PayrollPeriod,
  direction: -1 | 1
): PayrollPeriod {
  if (usesWeeklyPayroll(category)) {
    const anchor = period.key.startsWith("w-")
      ? period.key.slice(2)
      : period.periodStart;
    const start = parseDateISO(anchor);
    start.setDate(start.getDate() + direction * 7);
    return getWeeklyPayrollPeriod(formatDateISO(start));
  }

  const [, yearStr, monthStr, halfStr] = period.key.startsWith("s-")
    ? ["s", ...period.key.slice(2).split("-")]
    : ["", ...period.key.split("-")];

  let year = Number(yearStr);
  let month = Number(monthStr);
  let half = Number(halfStr) as PayrollPeriodHalf;

  if (direction === 1) {
    if (half === 1) half = 2;
    else {
      half = 1;
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
  } else {
    if (half === 2) half = 1;
    else {
      half = 2;
      month -= 1;
      if (month < 1) {
        month = 12;
        year -= 1;
      }
    }
  }

  return getSemiMonthlyPayrollPeriod(year, month, half);
}

export const payrollTabMeta: Record<
  PayrollTab,
  { label: string; description: string; scheduleNote: string }
> = {
  construction: {
    label: "Construction",
    description: "Weekly daily-rate payroll from attendance days worked.",
    scheduleNote:
      "Weekly cutoffs (Mon–Sun), paid on Saturday of that week.",
  },
  admin: {
    label: "Admin",
    description: "Hourly payroll from time in / time out records.",
    scheduleNote:
      "Semi-monthly pay on the 15th and last day of the month (30th/31st) — standard for PH office staff.",
  },
  ojt: {
    label: "OJT",
    description: "Hourly payroll for on-the-job trainees from time in / time out.",
    scheduleNote:
      "Semi-monthly pay on the 15th and last day of the month (30th/31st) — same schedule as admin staff.",
  },
};

export function countWeekdaysInPeriod(period: PayrollPeriod): number {
  const start = parseDateISO(period.periodStart);
  const end = parseDateISO(period.periodEnd);
  let count = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    const day = cursor.getDay();
    if (day >= 1 && day <= 5) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}
