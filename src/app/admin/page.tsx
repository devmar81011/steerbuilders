import { DashboardPayrollSummary } from "@/components/admin/dashboard-payroll-summary";
import { getEmployees, getPayrollEntries } from "@/lib/actions/payroll";

export default async function AdminDashboardPage() {
  const [employees, payroll] = await Promise.all([
    getEmployees(),
    getPayrollEntries(),
  ]);

  const activeEmployees = employees.filter((e) => e.status === "active").length;

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
          Overview
        </p>
        <h1 className="mt-2 text-2xl font-bold text-sbc-gold">Dashboard</h1>
        <p className="mt-2 text-sm font-semibold text-sbc-gray">
          Payroll and project management for Steer Builders.
        </p>
      </div>

      <DashboardPayrollSummary
        initialPayroll={payroll}
        activeEmployees={activeEmployees}
      />
    </>
  );
}
