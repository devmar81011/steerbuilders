import { EmployeesClient } from "@/components/admin/employees-client";
import { getEmployees } from "@/lib/actions/payroll";
import { getSites } from "@/lib/actions/sites";

export default async function EmployeesPage() {
  const [employees, sites] = await Promise.all([getEmployees(), getSites()]);

  return <EmployeesClient employees={employees} sites={sites} />;
}
