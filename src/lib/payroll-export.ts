import type { Employee, PayrollEntry } from "@/lib/mvp-data";
import type { PayrollAdjustment } from "@/lib/payroll-adjustments";
import type { PayrollPeriod, PayrollTab } from "@/lib/payroll-periods";
import {
  getDeductionAmount,
  resolveEntryDeductionBreakdown,
} from "@/lib/deduction-lines";
import { payrollTabMeta } from "@/lib/payroll-periods";

type CsvCell = string | number;

function protectSpreadsheetText(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function escapeCsvCell(value: CsvCell): string {
  const text =
    typeof value === "number" ? String(value) : protectSpreadsheetText(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function csvRow(values: CsvCell[]): string {
  return values.map(escapeCsvCell).join(",");
}

function employeeForEntry(entry: PayrollEntry, employees: Employee[]) {
  return employees.find((employee) => employee.id === entry.employeeId);
}

export function buildPayrollCsv(input: {
  entries: PayrollEntry[];
  employees: Employee[];
  payrollAdjustments: PayrollAdjustment[];
  category: PayrollTab;
  period: PayrollPeriod;
}): string {
  const { entries, employees, payrollAdjustments, category, period } = input;
  const deductionModules = payrollAdjustments
    .filter((rule) => rule.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const rows: string[] = [
    csvRow(["Company", "Steer Builders Corporation"]),
    csvRow(["Payroll Category", payrollTabMeta[category].label]),
    csvRow(["Period", period.label]),
    csvRow(["Period Start", period.periodStart]),
    csvRow(["Period End", period.periodEnd]),
    csvRow(["Process Date", period.processDate]),
    "",
    csvRow([
      "Employee",
      "Site Assignment",
      "Daily Rate",
      "Designation",
      "Hourly Rate",
      "Regular Hours",
      "OT Hours",
      "Regular Pay",
      "OT Pay",
      "Gross Pay",
      "Cash Advance",
      "Additional Pay",
      ...deductionModules.map((rule) => rule.label),
      "Total Statutory Deductions",
      "Net Pay",
      "Disbursement",
      "Remarks",
      "Charged To",
      "Status",
    ]),
  ];

  for (const entry of entries) {
    const employee = employeeForEntry(entry, employees);
    const breakdown = resolveEntryDeductionBreakdown(
      entry,
      payrollAdjustments,
      employee
        ? { category: employee.category, designation: employee.designation }
        : undefined
    );

    rows.push(
      csvRow([
        entry.employeeName,
        entry.siteAssignment,
        entry.dailyRate,
        entry.designation,
        entry.hourlyRate,
        entry.hours,
        entry.overtimeHours,
        entry.regularPay,
        entry.overtimePay,
        entry.grossPay,
        entry.cashAdvance,
        entry.additionalPay,
        ...deductionModules.map((rule) =>
          getDeductionAmount(breakdown, rule.code)
        ),
        entry.deductions,
        entry.netPay,
        entry.disbursement,
        entry.remarks,
        entry.chargedTo,
        entry.status,
      ])
    );
  }

  const numericTotal = (pick: (entry: PayrollEntry) => number) =>
    entries.reduce((sum, entry) => sum + pick(entry), 0);

  rows.push(
    csvRow([
      "",
      "TOTAL",
      "",
      "",
      "",
      "",
      numericTotal((entry) => entry.hours),
      numericTotal((entry) => entry.overtimeHours),
      numericTotal((entry) => entry.regularPay),
      numericTotal((entry) => entry.overtimePay),
      numericTotal((entry) => entry.grossPay),
      numericTotal((entry) => entry.cashAdvance),
      numericTotal((entry) => entry.additionalPay),
      ...deductionModules.map((rule) =>
        entries.reduce((sum, entry) => {
          const employee = employeeForEntry(entry, employees);
          const breakdown = resolveEntryDeductionBreakdown(
            entry,
            payrollAdjustments,
            employee
              ? { category: employee.category, designation: employee.designation }
              : undefined
          );
          return sum + getDeductionAmount(breakdown, rule.code);
        }, 0)
      ),
      numericTotal((entry) => entry.deductions),
      numericTotal((entry) => entry.netPay),
      "",
      "",
      "",
      "",
    ])
  );

  return `\uFEFF${rows.join("\r\n")}\r\n`;
}

export function payrollExportFilename(
  category: PayrollTab,
  period: PayrollPeriod
): string {
  const safeKey = period.key.replace(/[^a-z0-9-]+/gi, "-");
  return `steer-builders-payroll-${category}-${safeKey}.csv`;
}
