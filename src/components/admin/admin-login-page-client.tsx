"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/admin/login-form";
import {
  AdminThemeProvider,
  AdminThemeToggle,
} from "@/components/admin/admin-theme";

type Props = {
  supabaseConfigured: boolean;
  adminUrl: string;
};

export function AdminLoginPageClient({
  supabaseConfigured,
  adminUrl,
}: Props) {
  return (
    <AdminThemeProvider>
      <div className="relative flex min-h-screen items-center justify-center bg-sbc-off-white px-6">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <AdminThemeToggle />
        </div>
        <Card className="w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <Image
              src="/brand/logo-sbc-mark.png"
              alt="SBC"
              width={64}
              height={64}
              unoptimized
            />
          </div>
          <h1 className="text-center text-xl font-bold text-sbc-gold">
            Admin Sign In
          </h1>
          <p className="mt-2 text-center text-sm font-semibold text-sbc-gray">
            Sign in with your Steer Builders administrator account.
          </p>

          {!supabaseConfigured && (
            <p className="mt-4 rounded-lg border border-sbc-gold/30 bg-sbc-gold/10 px-4 py-3 text-sm font-semibold text-sbc-black">
              This deployment is missing Supabase settings. Use the live admin URL
              instead:{" "}
              <Link href={adminUrl} className="text-sbc-gold hover:underline">
                {adminUrl}
              </Link>
            </p>
          )}

          <LoginForm supabaseConfigured={supabaseConfigured} />
        </Card>
      </div>
    </AdminThemeProvider>
  );
}
