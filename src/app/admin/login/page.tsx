import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/admin/login-form";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import Image from "next/image";

export default async function AdminLoginPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.app_metadata.role === "admin") redirect("/admin");
  }

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
          <p className="mt-4 border border-sbc-gold/30 bg-sbc-gold/10 px-4 py-3 text-sm font-semibold text-sbc-black">
            Supabase is not configured on this deployment. Add{" "}
            <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in
            Vercel, then redeploy.
          </p>
        )}

        <LoginForm supabaseConfigured={isSupabaseConfigured()} />
      </Card>
    </div>
  );
}
