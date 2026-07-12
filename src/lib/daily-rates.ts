import type { EmployeeCategory, EmployeeRole } from "@/lib/employee-categories";

export type DailyRate = {
  id: string;
  category: EmployeeCategory;
  role: EmployeeRole | string;
  rate: number;
  rateType: "hourly" | "salary";
};

export const mockDailyRates: DailyRate[] = [
  { id: "rate-1", category: "construction", role: "Foreman", rate: 450, rateType: "hourly" },
  { id: "rate-2", category: "construction", role: "Skilled", rate: 380, rateType: "hourly" },
  { id: "rate-3", category: "construction", role: "Labor", rate: 320, rateType: "hourly" },
  { id: "rate-4", category: "admin", role: "Operations", rate: 65000, rateType: "salary" },
  { id: "rate-5", category: "admin", role: "Finance/Admin", rate: 55000, rateType: "salary" },
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
