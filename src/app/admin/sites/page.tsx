import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getSites } from "@/lib/actions/sites";
import { SitesClient } from "@/components/admin/sites-client";

export const metadata: Metadata = {
  title: "Sites - Steer Builders Admin",
};

export default async function SitesPage() {
  await requireAdmin();
  const sites = await getSites();

  return <SitesClient sites={sites} />;
}
