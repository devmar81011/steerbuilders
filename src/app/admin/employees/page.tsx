import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockEmployees, formatCurrency } from "@/lib/mvp-data";

export default function EmployeesPage() {
  return (
    <AdminShell>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
            Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold text-sbc-gold">Employees</h1>
        </div>
        <Button size="sm">+ Add Employee</Button>
      </div>

      <Card className="mb-8">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-sbc-gray">
          Add Employee (MVP — form preview)
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full Name" placeholder="Employee name" />
          <Input label="Role" placeholder="e.g. Site Foreman" />
          <Input label="Rate" placeholder="450" type="number" />
          <Input label="Rate Type" placeholder="hourly or salary" />
        </div>
        <p className="mt-3 text-xs font-medium text-sbc-gray">
          Saves to Supabase when database is connected.
        </p>
      </Card>

      <div className="overflow-x-auto border border-sbc-gray-light bg-sbc-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-sbc-gray-light bg-sbc-off-white">
            <tr>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Name
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Role
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Rate
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {mockEmployees.map((emp) => (
              <tr key={emp.id} className="border-b border-sbc-gray-light">
                <td className="px-4 py-3 font-semibold">{emp.name}</td>
                <td className="px-4 py-3 font-medium text-sbc-gray">{emp.role}</td>
                <td className="px-4 py-3 font-medium">
                  {emp.rateType === "hourly"
                    ? `${formatCurrency(emp.rate)}/hr`
                    : `${formatCurrency(emp.rate)}/mo`}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium uppercase tracking-widest ${
                      emp.status === "active" ? "text-sbc-gold" : "text-sbc-gray"
                    }`}
                  >
                    {emp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs font-medium text-sbc-gray">
        <Link href="/mvp" className="text-sbc-gold hover:underline">
          View MVP roadmap
        </Link>{" "}
        for Supabase integration status.
      </p>
    </AdminShell>
  );
}
