import type { DeductionRoleRate } from "@/lib/deduction-role-rates";

export type AdjustmentCalcType =
  | "percent_of_gross"
  | "percent_of_basic"
  | "fixed_per_period";

export type PayrollAdjustment = {
  id: string;
  code: string;
  label: string;
  calcType: AdjustmentCalcType;
  /** Default percent or fixed amount when no role override applies. */
  value: number;
  active: boolean;
  description: string;
  sortOrder: number;
  /** Optional per category + role overrides. */
  roleRates?: DeductionRoleRate[];
};

export const mockPayrollAdjustments: PayrollAdjustment[] = [
  {
    id: "adj-sss",
    code: "sss",
    label: "SSS",
    calcType: "fixed_per_period",
    value: 0,
    active: false,
    description:
      "Employee SSS contribution — leave empty until contribution table is set.",
    sortOrder: 1,
  },
  {
    id: "adj-philhealth",
    code: "philhealth",
    label: "PhilHealth",
    calcType: "percent_of_basic",
    value: 2.5,
    active: true,
    description:
      "Employee PhilHealth share — 5% of basic pay divided by 2 (admin).",
    sortOrder: 2,
  },
  {
    id: "adj-pagibig",
    code: "pagibig",
    label: "Pag-IBIG",
    calcType: "fixed_per_period",
    value: 200,
    active: true,
    description:
      "Employee Pag-IBIG share — fixed ₱200 per pay run (admin).",
    sortOrder: 3,
  },
];

export function formatCalcTypeLabel(calcType: AdjustmentCalcType): string {
  if (calcType === "percent_of_gross") return "% of gross pay";
  if (calcType === "percent_of_basic") return "% of basic pay";
  return "Fixed per pay run";
}

export function formatAdjustmentValue(
  rule: PayrollAdjustment,
  value: number = rule.value
): string {
  if (
    rule.calcType === "percent_of_gross" ||
    rule.calcType === "percent_of_basic"
  ) {
    return `${value}%`;
  }
  return `₱${value.toLocaleString("en-PH")}`;
}

export function formatDefaultAdjustmentValue(rule: PayrollAdjustment): string {
  const suffix = rule.roleRates?.length ? " default" : "";
  return `${formatAdjustmentValue(rule)}${suffix}`;
}
