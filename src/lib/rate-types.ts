import { formatCurrency } from "@/lib/mvp-data";
import type { EmployeeCategory } from "@/lib/employee-categories";
import { isDailyCategory } from "@/lib/employee-categories";

export type RateType = "hourly" | "daily" | "monthly";
export const MONTHLY_WORK_DAYS = 26;

/** Normalize legacy DB values while preserving explicit hourly and daily rows. */
export function normalizeRateType(
  value: string | null | undefined,
  category?: EmployeeCategory
): RateType {
  if (value === "monthly") return "monthly";
  if (value === "daily") return "daily";
  if (value === "hourly") return "hourly";
  if (value === "salary") return "monthly";
  return category && isDailyCategory(category) ? "daily" : "monthly";
}

export function defaultRateTypeForCategory(
  category: EmployeeCategory
): RateType {
  return isDailyCategory(category) ? "daily" : "monthly";
}

export function formatRateTypeLabel(rateType: RateType): string {
  if (rateType === "monthly") return "Monthly";
  return rateType === "daily" ? "Daily" : "Hourly";
}

export function formatRateAmount(rate: number, rateType: RateType): string {
  if (rateType === "monthly") return `${formatCurrency(rate)}/month`;
  if (rateType === "daily") return `${formatCurrency(rate)}/day`;
  return `${formatCurrency(rate)}/hr`;
}

export function getPayrollUnitRate(
  rate: number,
  rateType: RateType,
  category: EmployeeCategory
): number {
  if (isDailyCategory(category)) {
    if (rateType === "monthly") return rate / MONTHLY_WORK_DAYS;
    return rateType === "hourly" ? rate * 8 : rate;
  }
  if (rateType === "monthly") return rate / MONTHLY_WORK_DAYS / 8;
  return rateType === "daily" ? rate / 8 : rate;
}
