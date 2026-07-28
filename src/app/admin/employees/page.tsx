import { EmployeesClient } from "@/components/admin/employees-client";
import { getPayrollAdjustments } from "@/lib/actions/adjustments";
import { getEmployees } from "@/lib/actions/payroll";
import { getSites } from "@/lib/actions/sites";

export default async function EmployeesPage() {
  const [employees, sites, adjustments] = await Promise.all([
    getEmployees(),
    getSites(),
    getPayrollAdjustments(),
  ]);

  return (
    <EmployeesClient
      employees={employees}
      sites={sites}
      adjustments={adjustments}
    />
  );
}
