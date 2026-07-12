import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/admin/login-form";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";

export default async function AdminLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.app_metadata.role === "admin") redirect("/admin");

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

        <LoginForm />
      </Card>
    </div>
  );
}
