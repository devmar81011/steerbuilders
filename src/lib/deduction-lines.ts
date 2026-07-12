import type { EmployeeDeductionContext } from "@/lib/deduction-role-rates";
import type { PayrollAdjustment } from "@/lib/payroll-adjustments";
import { computePayrollAdjustments } from "@/lib/compute-payroll-adjustments";

export type DeductionLine = {
  code: string;
  label: string;
  amount: number;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildDeductionBreakdown(
  grossPay: number,
  rules: PayrollAdjustment[],
  employee?: EmployeeDeductionContext
): DeductionLine[] {
  const { deductionLines } = computePayrollAdjustments(
    grossPay,
    rules,
    employee
  );
  return deductionLines.map((line) => ({
    code: line.code,
    label: line.label,
    amount: line.amount,
  }));
}

export function resolveEntryDeductionBreakdown(
  entry: { grossPay: number; deductionBreakdown?: DeductionLine[] },
  rules: PayrollAdjustment[],
  employee?: EmployeeDeductionContext
): DeductionLine[] {
  if (entry.deductionBreakdown?.length) {
    return entry.deductionBreakdown;
  }
  return buildDeductionBreakdown(entry.grossPay, rules, employee);
}

export function getDeductionAmount(
  breakdown: DeductionLine[],
  code: string
): number {
  return breakdown.find((line) => line.code === code)?.amount ?? 0;
}

export function sumDeductionLines(lines: DeductionLine[]): number {
  return roundMoney(lines.reduce((sum, line) => sum + line.amount, 0));
}

export function slugifyDeductionCode(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}
