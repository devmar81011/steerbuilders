import {
  countAdminRegularAndOvertimeHours,
  countPresentDays,
  getWeekStart,
  parseDateISO,
  shiftWeekStart,
  type AdminAttendanceRow,
  type AttendanceRow,
} from "@/lib/attendance";
import type { Employee, PayrollEntry } from "@/lib/mvp-data";
import type { PayrollPeriod, PayrollTab } from "@/lib/payroll-periods";
import { usesWeeklyPayroll } from "@/lib/employee-categories";
import type { PayrollAdjustment } from "@/lib/payroll-adjustments";
import { mockPayrollAdjustments } from "@/lib/payroll-adjustments";
import {
  computePayrollAdjustments,
} from "@/lib/compute-payroll-adjustments";
import {
  calculatePayrollAmounts,
  derivePayrollRates,
  roundPayrollAmount,
} from "@/lib/payroll-calculations";

function resolveAdjustments(adjustments: PayrollAdjustment[]): PayrollAdjustment[] {
  return adjustments.length ? adjustments : mockPayrollAdjustments;
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

export function applyAttendanceToPayrollEntry(
  entry: PayrollEntry,
  employee: Employee,
  constructionAttendance: AttendanceRow[],
  hourlyAttendance: AdminAttendanceRow[],
  category: PayrollTab,
  adjustments: PayrollAdjustment[] = []
): PayrollEntry {
  if (entry.status === "processed") return entry;

  const rules = resolveAdjustments(adjustments);
  let hours = 0;
  let computedOvertimeHours = 0;

  if (category === "construction") {
    const row = constructionAttendance.find(
      (item) => item.employeeId === employee.id
    );
    hours = (row ? countPresentDays(row) : 0) * 8;
  } else {
    const rows = hourlyAttendance.filter((item) => item.employeeId === employee.id);
    const totals = rows.reduce(
      (sum, row) => {
        const dayTotals = countAdminRegularAndOvertimeHours(row);
        sum.regularHours += dayTotals.regularHours;
        sum.overtimeHours += dayTotals.overtimeHours;
        return sum;
      },
      { regularHours: 0, overtimeHours: 0 }
    );
    hours = roundPayrollAmount(totals.regularHours);
    computedOvertimeHours = roundPayrollAmount(totals.overtimeHours);
  }

  const overtimeHours =
    computedOvertimeHours > 0
      ? computedOvertimeHours
      : Number(entry.overtimeHours) || 0;
  const { dailyRate, hourlyRate } = derivePayrollRates(
    employee.rate,
    employee.rateType
  );
  const baseAmounts = calculatePayrollAmounts({
    hourlyRate,
    regularHours: hours,
    overtimeHours,
  });

  const { deductionLines, totalDeductions } = computePayrollAdjustments(
    baseAmounts.grossPay,
    rules,
    { category: employee.category, role: employee.role }
  );
  const deductionBreakdown = deductionLines.map((line) => ({
    code: line.code,
    label: line.label,
    amount: line.amount,
  }));
  const deductions = totalDeductions;
  const amounts = calculatePayrollAmounts({
    hourlyRate,
    regularHours: hours,
    overtimeHours,
    cashAdvance: Number(entry.cashAdvance) || 0,
    additionalPay: Number(entry.additionalPay) || 0,
    statutoryDeductions: deductions,
  });

  return {
    ...entry,
    employeeNumber: employee.employeeNumber,
    designation: employee.role,
    dailyRate,
    hourlyRate,
    hours,
    overtimeHours,
    regularPay: amounts.regularPay,
    overtimePay: amounts.overtimePay,
    grossPay: amounts.grossPay,
    deductions,
    deductionBreakdown,
    netPay: amounts.netPay,
    status: "draft",
  };
}

export function applyAttendanceToPayrollEntries(
  entries: PayrollEntry[],
  employees: Employee[],
  constructionAttendance: AttendanceRow[],
  hourlyAttendance: AdminAttendanceRow[],
  category: PayrollTab,
  adjustments: PayrollAdjustment[] = []
): PayrollEntry[] {
  return entries.map((entry) => {
    const employee = employees.find((item) => item.id === entry.employeeId);
    if (!employee) return entry;

    return applyAttendanceToPayrollEntry(
      entry,
      employee,
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
