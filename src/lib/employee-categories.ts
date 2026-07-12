export type EmployeeCategory = "construction" | "admin";

export type ConstructionRole = "Foreman" | "Skilled" | "Labor";
export type AdminRole = "Operations" | "Finance/Admin";
export type EmployeeRole = ConstructionRole | AdminRole;

export const employeeCategories = {
  construction: {
    label: "Construction",
    roles: ["Foreman", "Skilled", "Labor"] as ConstructionRole[],
  },
  admin: {
    label: "Admin",
    roles: ["Operations", "Finance/Admin"] as AdminRole[],
  },
} as const;

export function getRolesForCategory(category: EmployeeCategory): EmployeeRole[] {
  return [...employeeCategories[category].roles];
}

export function formatEmployeeCategory(category: EmployeeCategory) {
  return employeeCategories[category].label;
}
