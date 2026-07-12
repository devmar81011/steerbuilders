import type { EmployeeCategory, EmployeeRole } from "@/lib/employee-categories";
import { employeeCategories } from "@/lib/employee-categories";

export type DeductionRoleRate = {
  id: string;
  adjustmentId: string;
  category: EmployeeCategory;
  role: EmployeeRole;
  value: number;
};

export type EmployeeDeductionContext = {
  category: EmployeeCategory;
  role: EmployeeRole;
};

export function roleRateKey(category: EmployeeCategory, role: string) {
  return `${category}:${role}`;
}

export function parseRoleRateKey(key: string): {
  category: EmployeeCategory;
  role: string;
} {
  const [category, ...roleParts] = key.split(":");
  return {
    category: category as EmployeeCategory,
    role: roleParts.join(":"),
  };
}

export function listAllCategoryRoles(): {
  category: EmployeeCategory;
  role: EmployeeRole;
}[] {
  return Object.entries(employeeCategories).flatMap(([category, meta]) =>
    meta.roles.map((role) => ({
      category: category as EmployeeCategory,
      role,
    }))
  );
}

export function resolveDeductionValue(
  defaultValue: number,
  roleRates: DeductionRoleRate[] | undefined,
  employee?: EmployeeDeductionContext
): number {
  if (!employee || !roleRates?.length) return defaultValue;

  const match = roleRates.find(
    (rate) =>
      rate.category === employee.category && rate.role === employee.role
  );

  return match?.value ?? defaultValue;
}

export function getRoleOverride(
  roleRates: DeductionRoleRate[] | undefined,
  category: EmployeeCategory,
  role: EmployeeRole
): DeductionRoleRate | undefined {
  return roleRates?.find(
    (rate) => rate.category === category && rate.role === role
  );
}

export function mergeRoleRatesForCategory(
  activeCategory: EmployeeCategory,
  formRates: Record<string, string>,
  existingRoleRates: DeductionRoleRate[] | undefined,
  roles: EmployeeRole[]
): { category: EmployeeCategory; role: EmployeeRole; value: number }[] {
  const kept =
    existingRoleRates
      ?.filter((rate) => rate.category !== activeCategory)
      .map((rate) => ({
        category: rate.category,
        role: rate.role,
        value: rate.value,
      })) ?? [];

  const updated = roles
    .map((role) => {
      const raw = formRates[roleRateKey(activeCategory, role)]?.trim();
      if (!raw) return null;
      const value = Number(raw);
      if (Number.isNaN(value)) return null;
      return { category: activeCategory, role, value };
    })
    .filter((rate) => rate !== null);

  return [...kept, ...updated];
}

export const mockDeductionRoleRates: DeductionRoleRate[] = [
  {
    id: "drr-1",
    adjustmentId: "adj-sss",
    category: "construction",
    role: "Labor",
    value: 450,
  },
  {
    id: "drr-2",
    adjustmentId: "adj-sss",
    category: "construction",
    role: "Skilled",
    value: 550,
  },
  {
    id: "drr-3",
    adjustmentId: "adj-sss",
    category: "construction",
    role: "Foreman",
    value: 650,
  },
  {
    id: "drr-4",
    adjustmentId: "adj-pagibig",
    category: "ojt",
    role: "Trainee",
    value: 100,
  },
];
