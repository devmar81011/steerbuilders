export type EmployeeCategory = "construction" | "admin" | "ojt";

export type ConstructionRole = "Foreman" | "Skilled" | "Labor";
export type AdminRole = "Operations" | "Finance/Admin";
export type OjtRole = "Trainee";
export type EmployeeRole = ConstructionRole | AdminRole | OjtRole;

export const employeeCategories = {
  construction: {
    label: "Construction",
    roles: ["Foreman", "Skilled", "Labor"] as ConstructionRole[],
  },
  admin: {
    label: "Admin",
    roles: ["Operations", "Finance/Admin"] as AdminRole[],
  },
  ojt: {
    label: "OJT",
    roles: ["Trainee"] as OjtRole[],
  },
} as const;

export const payrollCategories: EmployeeCategory[] = [
  "construction",
  "admin",
  "ojt",
];

export function getRolesForCategory(category: EmployeeCategory): EmployeeRole[] {
  return [...employeeCategories[category].roles];
}

export function formatEmployeeCategory(category: EmployeeCategory) {
  return employeeCategories[category].label;
}

export function getCategoryLabelClass(category: EmployeeCategory) {
  if (category === "construction") return "text-sbc-gray";
  if (category === "ojt") return "text-emerald-700";
  return "text-sbc-gold-dark";
}

export function isHourlyCategory(category: EmployeeCategory): boolean {
  return category === "admin" || category === "ojt";
}

export function isDailyCategory(category: EmployeeCategory): boolean {
  return category === "construction";
}

export function usesWeeklyPayroll(category: EmployeeCategory): boolean {
  return category === "construction";
}

export function usesSemiMonthlyPayroll(category: EmployeeCategory): boolean {
  return category === "admin" || category === "ojt";
}

export function usesTimeInOutAttendance(category: EmployeeCategory): boolean {
  return isHourlyCategory(category);
}
