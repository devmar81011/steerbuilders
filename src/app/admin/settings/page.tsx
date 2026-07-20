import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getSites } from "@/lib/actions/sites";
import { getDisbursementMethods } from "@/lib/actions/site-settings";
import { SettingsClient } from "@/components/admin/settings-client";

export const metadata: Metadata = {
  title: "Settings - Steer Builders Admin",
};

export default async function SettingsPage() {
  await requireAdmin();
  const [sites, disbursementMethods] = await Promise.all([
    getSites(),
    getDisbursementMethods(),
  ]);

  return (
    <SettingsClient
      sites={sites}
      initialDisbursementMethods={disbursementMethods}
    />
  );
}
