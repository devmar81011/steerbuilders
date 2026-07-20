import type { EmployeeCategory, EmployeeDesignation } from "@/lib/employee-categories";
import { employeeCategories } from "@/lib/employee-categories";

export type DeductionRoleRate = {
  id: string;
  adjustmentId: string;
  category: EmployeeCategory;
  designation: EmployeeDesignation;
  value: number;
};

export type EmployeeDeductionContext = {
  category: EmployeeCategory;
  designation: EmployeeDesignation;
};

export function roleRateKey(category: EmployeeCategory, designation: string) {
  return `${category}:${designation}`;
}

export function parseRoleRateKey(key: string): {
  category: EmployeeCategory;
  designation: string;
} {
  const [category, ...designationParts] = key.split(":");
  return {
    category: category as EmployeeCategory,
    designation: designationParts.join(":"),
  };
}

export function listAllCategoryRoles(): {
  category: EmployeeCategory;
  designation: EmployeeDesignation;
}[] {
  return Object.entries(employeeCategories).flatMap(([category, meta]) =>
    meta.designations.map((designation) => ({
      category: category as EmployeeCategory,
      designation,
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
      rate.category === employee.category && rate.designation === employee.designation
  );

  return match?.value ?? defaultValue;
}

export function getRoleOverride(
  roleRates: DeductionRoleRate[] | undefined,
  category: EmployeeCategory,
  designation: EmployeeDesignation
): DeductionRoleRate | undefined {
  return roleRates?.find(
    (rate) => rate.category === category && rate.designation === designation
  );
}

export function mergeRoleRatesForCategory(
  activeCategory: EmployeeCategory,
  formRates: Record<string, string>,
  existingRoleRates: DeductionRoleRate[] | undefined,
  designations: EmployeeDesignation[]
): { category: EmployeeCategory; designation: EmployeeDesignation; value: number }[] {
  const kept =
    existingRoleRates
      ?.filter((rate) => rate.category !== activeCategory)
      .map((rate) => ({
        category: rate.category,
        designation: rate.designation,
        value: rate.value,
      })) ?? [];

  const updated = designations
    .map((designation) => {
      const raw = formRates[roleRateKey(activeCategory, designation)]?.trim();
      if (!raw) return null;
      const value = Number(raw);
      if (Number.isNaN(value)) return null;
      return { category: activeCategory, designation, value };
    })
    .filter((rate) => rate !== null);

  return [...kept, ...updated];
}

export const mockDeductionRoleRates: DeductionRoleRate[] = [
  {
    id: "drr-1",
    adjustmentId: "adj-sss",
    category: "construction",
    designation: "Labor",
    value: 450,
  },
  {
    id: "drr-2",
    adjustmentId: "adj-sss",
    category: "construction",
    designation: "Skilled",
    value: 550,
  },
  {
    id: "drr-3",
    adjustmentId: "adj-sss",
    category: "construction",
    designation: "Foreman",
    value: 650,
  },
  {
    id: "drr-4",
    adjustmentId: "adj-pagibig",
    category: "ojt",
    designation: "Trainee",
    value: 100,
  },
];
