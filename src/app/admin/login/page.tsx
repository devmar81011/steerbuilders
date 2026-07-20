import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAdminHost,
  isSupabaseConfigured,
  shouldRedirectToConfiguredAdminHost,
} from "@/lib/supabase/config";
import { AdminLoginPageClient } from "@/components/admin/admin-login-page-client";

export default async function AdminLoginPage() {
  const host = (await headers()).get("host");

  if (shouldRedirectToConfiguredAdminHost(host)) {
    redirect(`https://${getAdminHost()}/admin/login`);
  }

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.app_metadata.role === "admin") redirect("/admin");
  }

  return (
    <AdminLoginPageClient
      supabaseConfigured={isSupabaseConfigured()}
      adminUrl={`https://${getAdminHost()}/admin/login`}
    />
  );
}
