import { redirect } from "next/navigation";
import { SuperadminShell } from "@/components/superadmin/superadmin-shell";
import { SuperadminTools } from "@/components/superadmin/superadmin-tools";
import { isSuperadminAuthenticated } from "@/lib/superadmin-auth";

export default async function SuperadminToolsPage() {
  if (!(await isSuperadminAuthenticated())) {
    redirect("/superadmin");
  }

  return (
    <SuperadminShell title="Reset / clean">
      <SuperadminTools />
    </SuperadminShell>
  );
}
