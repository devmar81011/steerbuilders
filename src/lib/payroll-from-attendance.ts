import {
  countAdminHours,
  countPresentDays,
  getWeekStart,
  parseDateISO,
  shiftWeekStart,
  type AdminAttendanceRow,
  type AttendanceRow,
} from "@/lib/attendance";
import type { DailyRate } from "@/lib/daily-rates";
import { findDailyRate } from "@/lib/daily-rates";
import type { Employee, PayrollEntry } from "@/lib/mvp-data";
import type { PayrollPeriod, PayrollTab } from "@/lib/payroll-periods";
import { usesWeeklyPayroll } from "@/lib/employee-categories";
import type { RateType } from "@/lib/rate-types";
import type { PayrollAdjustment } from "@/lib/payroll-adjustments";
import { mockPayrollAdjustments } from "@/lib/payroll-adjustments";
import {
  computeNetPay,
  computePayrollAdjustments,
} from "@/lib/compute-payroll-adjustments";

function resolveAdjustments(adjustments: PayrollAdjustment[]): PayrollAdjustment[] {
  return adjustments.length ? adjustments : mockPayrollAdjustments;
}

function resolveEmployeeRate(
  employee: Employee,
  dailyRates: DailyRate[]
): { rate: number; rateType: RateType } {
  const matched = findDailyRate(dailyRates, employee.category, employee.role);
  return {
    rate: matched?.rate ?? employee.rate,
    rateType: matched?.rateType ?? employee.rateType,
  };
}

export function getWeekStartsInPeriod(periodStart: string, periodEnd: string): string[] {
  const weeks: string[] = [];
  let current = getWeekStart(parseDateISO(periodStart));
  const end = parseDateISO(periodEnd);

  while (parseDateISO(current) <= end) {
    weeks.push(current);
    current = shiftWeekStart(current, 1);
  }

  return weeks;
}

function getAdminHourlyRate(rate: number, rateType: RateType): number {
  return rateType === "hourly" ? rate : rate / 8;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function applyAttendanceToPayrollEntry(
  entry: PayrollEntry,
  employee: Employee,
  rateInfo: { rate: number; rateType: RateType },
  constructionAttendance: AttendanceRow[],
  hourlyAttendance: AdminAttendanceRow[],
  category: PayrollTab,
  adjustments: PayrollAdjustment[] = []
): PayrollEntry {
  if (entry.status === "processed") return entry;

  const rules = resolveAdjustments(adjustments);
  let grossPay = 0;
  let hours = 0;

  if (category === "construction") {
    const row = constructionAttendance.find(
      (item) => item.employeeId === employee.id
    );
    hours = row ? countPresentDays(row) : 0;
    grossPay = roundMoney(hours * rateInfo.rate);
  } else {
    const rows = hourlyAttendance.filter((item) => item.employeeId === employee.id);
    hours = roundMoney(
      rows.reduce((total, row) => total + countAdminHours(row), 0)
    );
    const hourlyRate = getAdminHourlyRate(rateInfo.rate, rateInfo.rateType);
    grossPay = roundMoney(hours * hourlyRate);
  }

  const { deductionLines, totalDeductions } = computePayrollAdjustments(
    grossPay,
    rules,
    { category: employee.category, role: employee.role }
  );
  const deductionBreakdown = deductionLines.map((line) => ({
    code: line.code,
    label: line.label,
    amount: line.amount,
  }));
  const deductions = totalDeductions;
  const netPay = computeNetPay(grossPay, deductions);

  return {
    ...entry,
    hours,
    grossPay,
    deductions,
    deductionBreakdown,
    netPay,
    status: "draft",
  };
}

export function applyAttendanceToPayrollEntries(
  entries: PayrollEntry[],
  employees: Employee[],
  dailyRates: DailyRate[],
  constructionAttendance: AttendanceRow[],
  hourlyAttendance: AdminAttendanceRow[],
  category: PayrollTab,
  adjustments: PayrollAdjustment[] = []
): PayrollEntry[] {
  return entries.map((entry) => {
    const employee = employees.find((item) => item.id === entry.employeeId);
    if (!employee) return entry;

    const rateInfo = resolveEmployeeRate(employee, dailyRates);

    return applyAttendanceToPayrollEntry(
      entry,
      employee,
      rateInfo,
      constructionAttendance,
      hourlyAttendance,
      category,
      adjustments
    );
  });
}

export function getWeekStartsForPayrollPeriod(
  category: PayrollTab,
  period: PayrollPeriod
): string[] {
  if (usesWeeklyPayroll(category)) {
    return [period.periodStart];
  }
  return getWeekStartsInPeriod(period.periodStart, period.periodEnd);
}
