import { AdminShell } from "@/components/layout/admin-shell";
import { RatesClient } from "@/components/admin/rates-client";
import { getDailyRates } from "@/lib/actions/rates";

export default async function RatesPage() {
  const rates = await getDailyRates();

  return (
    <AdminShell>
      <RatesClient initialRates={rates} />
    </AdminShell>
  );
}
