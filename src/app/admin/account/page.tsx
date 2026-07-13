import { redirect } from "next/navigation";
import { AccountSettingsClient } from "@/components/admin/account-settings-client";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AdminAccountPage() {
  if (!isSupabaseConfigured()) {
    redirect("/admin/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata.role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
          Admin
        </p>
        <h1 className="mt-2 text-2xl font-bold text-sbc-gold">Account</h1>
        <p className="mt-2 text-sm font-semibold text-sbc-gray">
          Manage your administrator sign-in and password.
        </p>
      </div>

      <AccountSettingsClient email={user.email ?? "Administrator"} />
    </>
  );
}
