import type { EmployeeCategory, EmployeeRole } from "@/lib/employee-categories";
import type { RateType } from "@/lib/rate-types";

export type DailyRate = {
  id: string;
  category: EmployeeCategory;
  role: EmployeeRole | string;
  rate: number;
  rateType: RateType;
};

export const mockDailyRates: DailyRate[] = [
  { id: "rate-1", category: "construction", role: "Foreman", rate: 450, rateType: "daily" },
  { id: "rate-2", category: "construction", role: "Skilled", rate: 380, rateType: "daily" },
  { id: "rate-3", category: "construction", role: "Labor", rate: 320, rateType: "daily" },
  { id: "rate-4", category: "admin", role: "Operations", rate: 406.25, rateType: "hourly" },
  { id: "rate-5", category: "admin", role: "Finance/Admin", rate: 343.75, rateType: "hourly" },
  { id: "rate-6", category: "ojt", role: "Trainee", rate: 150, rateType: "hourly" },
];

export function findDailyRate(
  rates: DailyRate[],
  category: EmployeeCategory,
  role: string
): DailyRate | undefined {
  return rates.find((r) => r.category === category && r.role === role);
}

export function getRolesFromRates(
  rates: DailyRate[],
  category: EmployeeCategory
): string[] {
  return rates.filter((r) => r.category === category).map((r) => r.role);
}
