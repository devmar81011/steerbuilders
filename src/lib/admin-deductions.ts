/** Admin statutory deduction helpers — amounts come from Contributions rules. */

import { calculateAdjustmentAmount } from "@/lib/compute-payroll-adjustments";
import type { EmployeeDesignation } from "@/lib/employee-categories";
import type { PayrollAdjustment } from "@/lib/payroll-adjustments";

export type AdminStatutoryDeductions = {
  pagibig: number | null;
  phic: number | null;
  sss: number | null;
};

function amountForCode(
  rules: PayrollAdjustment[],
  code: string,
  basicPay: number | null | undefined,
  designation: EmployeeDesignation
): number | null {
  const rule = rules.find((item) => item.code === code);
  if (!rule || !rule.active) return null;

  return calculateAdjustmentAmount(rule, 0, {
    category: "admin",
    designation,
    basicPay,
  });
}

export function computeAdminStatutoryDeductions(
  basicPay: number | null | undefined,
  rules: PayrollAdjustment[] = [],
  designation: EmployeeDesignation = "Operations"
): AdminStatutoryDeductions {
  return {
    pagibig: amountForCode(rules, "pagibig", basicPay, designation),
    phic: amountForCode(rules, "philhealth", basicPay, designation),
    sss: amountForCode(rules, "sss", basicPay, designation),
  };
}

export function formatDeductionAmount(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDeductionRuleSummary(rules: PayrollAdjustment[]): string {
  const parts = ["pagibig", "philhealth", "sss"]
    .map((code) => rules.find((rule) => rule.code === code))
    .filter((rule): rule is PayrollAdjustment => Boolean(rule))
    .map((rule) => {
      const status = rule.active ? "" : " (off)";
      if (
        rule.calcType === "percent_of_basic" ||
        rule.calcType === "percent_of_gross"
      ) {
        return `${rule.label} ${rule.value}%${status}`;
      }
      return `${rule.label} ₱${rule.value.toLocaleString("en-PH")}${status}`;
    });

  if (!parts.length) {
    return "Set Pag-IBIG, PhilHealth, and SSS rates on the Deductions page.";
  }

  return `Current rules: ${parts.join(" · ")}. Edit % and amounts on Deductions.`;
}
