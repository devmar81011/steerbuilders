export type EmployeeCategory = "construction" | "admin" | "ojt";

export type ConstructionDesignation = "Foreman" | "Skilled" | "Labor";
export type AdminDesignation = "Operations" | "Finance/Admin";
export type OjtDesignation = "Trainee";
export type EmployeeDesignation = ConstructionDesignation | AdminDesignation | OjtDesignation;

export const employeeCategories = {
  construction: {
    label: "Construction",
    designations: ["Foreman", "Skilled", "Labor"] as ConstructionDesignation[],
  },
  admin: {
    label: "Admin",
    designations: ["Operations", "Finance/Admin"] as AdminDesignation[],
  },
  ojt: {
    label: "OJT",
    designations: ["Trainee"] as OjtDesignation[],
  },
} as const;

export const payrollCategories: EmployeeCategory[] = [
  "construction",
  "admin",
  "ojt",
];

export function getDesignationsForCategory(category: EmployeeCategory): EmployeeDesignation[] {
  return [...employeeCategories[category].designations];
}

// Legacy alias for backward compatibility
export function getRolesForCategory(category: EmployeeCategory): EmployeeDesignation[] {
  return getDesignationsForCategory(category);
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
