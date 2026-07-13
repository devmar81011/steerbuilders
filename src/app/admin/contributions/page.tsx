import { ContributionsClient } from "@/components/admin/contributions-client";
import { getPayrollAdjustments } from "@/lib/actions/adjustments";

export default async function ContributionsPage() {
  const adjustments = await getPayrollAdjustments();

  return <ContributionsClient initialAdjustments={adjustments} />;
}
