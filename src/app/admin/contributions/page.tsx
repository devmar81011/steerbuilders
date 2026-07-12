import { AdminShell } from "@/components/layout/admin-shell";
import { ContributionsClient } from "@/components/admin/contributions-client";
import { getPayrollAdjustments } from "@/lib/actions/adjustments";

export default async function ContributionsPage() {
  const adjustments = await getPayrollAdjustments();

  return (
    <AdminShell>
      <ContributionsClient initialAdjustments={adjustments} />
    </AdminShell>
  );
}
