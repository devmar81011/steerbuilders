import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockPayroll, formatCurrency } from "@/lib/mvp-data";

export default function PayrollPage() {
  const totalGross = mockPayroll.reduce((s, p) => s + p.grossPay, 0);
  const totalNet = mockPayroll.reduce((s, p) => s + p.netPay, 0);

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
            Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold text-sbc-gold">Payroll</h1>
          <p className="mt-1 text-sm font-semibold text-sbc-gray">
            Period: Jul 1–15, 2026
          </p>
        </div>
        <Button size="sm">Process Payroll Run</Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-6 text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
            Total Gross
          </p>
          <p className="mt-1 text-xl font-bold">{formatCurrency(totalGross)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
            Total Net
          </p>
          <p className="mt-1 text-xl font-bold text-sbc-gold">
            {formatCurrency(totalNet)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto border border-sbc-gray-light bg-sbc-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-sbc-gray-light bg-sbc-off-white">
            <tr>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Employee
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Hours
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Gross
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Deductions
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Net Pay
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {mockPayroll.map((entry) => (
              <tr key={entry.id} className="border-b border-sbc-gray-light">
                <td className="px-4 py-3 font-semibold">{entry.employeeName}</td>
                <td className="px-4 py-3 font-medium">{entry.hours}h</td>
                <td className="px-4 py-3 font-medium">
                  {formatCurrency(entry.grossPay)}
                </td>
                <td className="px-4 py-3 font-medium text-sbc-gray">
                  {formatCurrency(entry.deductions)}
                </td>
                <td className="px-4 py-3 font-bold text-sbc-gold">
                  {formatCurrency(entry.netPay)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={entry.status === "processed" ? "gold" : "light"}>
                    {entry.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs font-medium text-sbc-gray">
        MVP uses sample payroll data.{" "}
        <Link href="/mvp" className="text-sbc-gold hover:underline">
          Track progress
        </Link>{" "}
        as features go live.
      </p>
    </AdminShell>
  );
}
