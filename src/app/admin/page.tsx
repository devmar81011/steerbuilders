import { AdminShell } from "@/components/layout/admin-shell";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { mockEmployees, mockPayroll, formatCurrency } from "@/lib/mvp-data";

export default function AdminDashboardPage() {
  const activeEmployees = mockEmployees.filter((e) => e.status === "active").length;
  const totalPayroll = mockPayroll.reduce((sum, p) => sum + p.netPay, 0);
  const pendingRuns = mockPayroll.filter((p) => p.status === "draft").length;

  const stats = [
    { label: "Active Employees", value: String(activeEmployees) },
    { label: "Current Period Net Pay", value: formatCurrency(totalPayroll) },
    { label: "Pending Payroll Runs", value: String(pendingRuns) },
  ];

  return (
    <AdminShell>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
          Overview
        </p>
        <h1 className="mt-2 text-2xl font-bold text-sbc-gold">Admin Dashboard</h1>
        <p className="mt-2 text-sm font-semibold text-sbc-gray">
          MVP payroll system — mock data until Supabase is connected.
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-sbc-black">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="font-bold text-sbc-black">Quick Actions</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href="/admin/employees" size="sm">
              Manage Employees
            </ButtonLink>
            <ButtonLink href="/admin/projects" size="sm" variant="secondary">
              Manage Projects
            </ButtonLink>
            <ButtonLink href="/admin/payroll" size="sm" variant="secondary">
              Run Payroll
            </ButtonLink>
            <ButtonLink href="/admin/review" size="sm" variant="outline">
              PDF Review
            </ButtonLink>
            <ButtonLink href="/admin/design" size="sm" variant="outline">
              Admin Design
            </ButtonLink>
          </div>
        </Card>

        <Card>
          <h2 className="font-bold text-sbc-black">Recent Payroll</h2>
          <ul className="mt-4 space-y-3">
            {mockPayroll.slice(0, 3).map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between border-b border-sbc-gray-light pb-2 text-sm"
              >
                <span className="font-semibold">{entry.employeeName}</span>
                <span className="font-medium text-sbc-gold">
                  {formatCurrency(entry.netPay)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AdminShell>
  );
}
