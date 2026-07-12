import type { EmployeeDeductionContext } from "@/lib/deduction-role-rates";
import { resolveDeductionValue } from "@/lib/deduction-role-rates";
import type { PayrollAdjustment } from "@/lib/payroll-adjustments";

export type ComputedAdjustmentLine = PayrollAdjustment & {
  amount: number;
  appliedValue: number;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateAdjustmentAmount(
  rule: PayrollAdjustment,
  grossPay: number,
  employee?: EmployeeDeductionContext
): number {
  if (!rule.active) return 0;

  const appliedValue = resolveDeductionValue(
    rule.value,
    rule.roleRates,
    employee
  );

  if (rule.calcType === "percent_of_gross") {
    return roundMoney(grossPay * (appliedValue / 100));
  }

  return roundMoney(appliedValue);
}

export function computePayrollAdjustments(
  grossPay: number,
  rules: PayrollAdjustment[],
  employee?: EmployeeDeductionContext
) {
  const deductionLines: ComputedAdjustmentLine[] = rules
    .filter((rule) => rule.active)
    .map((rule) => {
      const appliedValue = resolveDeductionValue(
        rule.value,
        rule.roleRates,
        employee
      );

      return {
        ...rule,
        appliedValue,
        amount: calculateAdjustmentAmount(rule, grossPay, employee),
      };
    });

  const totalDeductions = roundMoney(
    deductionLines.reduce((sum, line) => sum + line.amount, 0)
  );

  return {
    deductionLines,
    totalDeductions,
  };
}

export function computeNetPay(grossPay: number, totalDeductions: number): number {
  return roundMoney(Math.max(grossPay - totalDeductions, 0));
}
