import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export default function AdminLoginPage() {
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
          Supabase Auth — connect env vars to enable login.
        </p>

        <form className="mt-8 flex flex-col gap-4">
          <Input label="Email" type="email" placeholder="admin@steerbuilders.com" />
          <Input label="Password" type="password" placeholder="••••••••" />
          <Button type="button" className="w-full">
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-xs font-medium text-sbc-gray">
          <Link href="/admin" className="text-sbc-gold hover:underline">
            Continue to dashboard →
          </Link>
        </p>
      </Card>
    </div>
  );
}
