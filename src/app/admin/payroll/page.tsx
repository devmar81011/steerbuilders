import { AdminShell } from "@/components/layout/admin-shell";
import { PayrollClient } from "@/components/admin/payroll-client";
import { getPayrollEntries } from "@/lib/actions/payroll";

export default async function PayrollPage() {
  const entries = await getPayrollEntries();

  return (
    <AdminShell>
      <PayrollClient initialEntries={entries} period="Jul 1–15, 2026" />
    </AdminShell>
  );
}
