import { formatCurrency } from "@/lib/mvp-data";
import type { EmployeeCategory } from "@/lib/employee-categories";
import { isDailyCategory } from "@/lib/employee-categories";

export type RateType = "hourly" | "daily";

/** Normalize legacy DB values (`salary` → hourly, construction hourly → daily). */
export function normalizeRateType(
  value: string | null | undefined,
  category?: EmployeeCategory
): RateType {
  if (value === "daily") return "daily";
  if (value === "hourly") {
    return category && isDailyCategory(category) ? "daily" : "hourly";
  }
  if (value === "salary") return "hourly";
  return category && isDailyCategory(category) ? "daily" : "hourly";
}

export function defaultRateTypeForCategory(
  category: EmployeeCategory
): RateType {
  return isDailyCategory(category) ? "daily" : "hourly";
}

export function formatRateTypeLabel(rateType: RateType): string {
  return rateType === "daily" ? "Daily" : "Hourly";
}

export function formatRateAmount(rate: number, rateType: RateType): string {
  return rateType === "daily"
    ? `${formatCurrency(rate)}/day`
    : `${formatCurrency(rate)}/hr`;
}

export function getPayrollUnitRate(
  rate: number,
  rateType: RateType,
  category: EmployeeCategory
): number {
  if (isDailyCategory(category)) {
    return rate;
  }
  return rateType === "hourly" ? rate : rate / 8;
}
