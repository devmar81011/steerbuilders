import { EmployeesClient } from "@/components/admin/employees-client";
import { getEmployees } from "@/lib/actions/payroll";
import { getDailyRates } from "@/lib/actions/rates";

export default async function EmployeesPage() {
  const [employees, dailyRates] = await Promise.all([
    getEmployees(),
    getDailyRates(),
  ]);
  return <EmployeesClient employees={employees} dailyRates={dailyRates} />;
}
