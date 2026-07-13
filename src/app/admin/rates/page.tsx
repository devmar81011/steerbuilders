import { RatesClient } from "@/components/admin/rates-client";
import { getDailyRates } from "@/lib/actions/rates";

export default async function RatesPage() {
  const rates = await getDailyRates();

  return <RatesClient initialRates={rates} />;
}
