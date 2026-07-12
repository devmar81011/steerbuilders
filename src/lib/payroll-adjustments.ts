import type { DeductionRoleRate } from "@/lib/deduction-role-rates";

export type AdjustmentCalcType = "percent_of_gross" | "fixed_per_period";

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
    value: 600,
    active: true,
    description:
      "Employee SSS contribution. Set a default amount, then optional overrides per role for weekly vs semi-monthly pay.",
    sortOrder: 1,
  },
  {
    id: "adj-philhealth",
    code: "philhealth",
    label: "PhilHealth",
    calcType: "percent_of_gross",
    value: 2.5,
    active: true,
    description:
      "Employee share of PhilHealth premium (typically ~50% of the total ~5% premium on basic salary).",
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
      "Employee Pag-IBIG share — commonly ₱100–₱200 or up to 2% of monthly compensation.",
    sortOrder: 3,
  },
];

export function formatCalcTypeLabel(calcType: AdjustmentCalcType): string {
  if (calcType === "percent_of_gross") return "% of gross pay";
  return "Fixed per pay run";
}

export function formatAdjustmentValue(
  rule: PayrollAdjustment,
  value: number = rule.value
): string {
  if (rule.calcType === "percent_of_gross") return `${value}%`;
  return `₱${value.toLocaleString("en-PH")}`;
}

export function formatDefaultAdjustmentValue(rule: PayrollAdjustment): string {
  const suffix = rule.roleRates?.length ? " default" : "";
  return `${formatAdjustmentValue(rule)}${suffix}`;
}
