import { EmployeesClient } from "@/components/admin/employees-client";
import { getEmployees } from "@/lib/actions/payroll";

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return <EmployeesClient employees={employees} />;
}
