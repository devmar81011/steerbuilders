import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/admin/login-form";
import { createClient } from "@/lib/supabase/server";
import {
  getAdminHost,
  isSupabaseConfigured,
  shouldRedirectToConfiguredAdminHost,
} from "@/lib/supabase/config";
import Image from "next/image";

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

  const adminUrl = `https://${getAdminHost()}/admin/login`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-sbc-off-white px-6">
      <Card className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Image
            src="/brand/logo-sbc.png"
            alt="SBC"
            width={64}
            height={64}
          />
        </div>
        <h1 className="text-center text-xl font-bold text-sbc-gold">Admin Sign In</h1>
        <p className="mt-2 text-center text-sm font-semibold text-sbc-gray">
          Sign in with your Steer Builders administrator account.
        </p>

        {!isSupabaseConfigured() && (
          <p className="mt-4 rounded-lg border border-sbc-gold/30 bg-sbc-gold/10 px-4 py-3 text-sm font-semibold text-sbc-black">
            This deployment is missing Supabase settings. Use the live admin URL
            instead:{" "}
            <Link href={adminUrl} className="text-sbc-gold hover:underline">
              {adminUrl}
            </Link>
          </p>
        )}

        <LoginForm supabaseConfigured={isSupabaseConfigured()} />
      </Card>
    </div>
  );
}
