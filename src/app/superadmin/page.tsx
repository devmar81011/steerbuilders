import { redirect } from "next/navigation";
import { SuperadminLoginForm } from "@/components/superadmin/superadmin-login-form";
import { isSuperadminAuthenticated } from "@/lib/superadmin-auth";

export default async function SuperadminPage() {
  if (await isSuperadminAuthenticated()) {
    redirect("/superadmin/tools");
  }

  return (
    <div className="flex min-h-screen items-center bg-sbc-off-white px-4 py-12">
      <SuperadminLoginForm />
    </div>
  );
}
