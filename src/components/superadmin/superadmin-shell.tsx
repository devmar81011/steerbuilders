"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SuperadminShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/superadmin/logout", { method: "POST" });
    router.push("/superadmin");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-sbc-off-white">
      <header className="border-b border-sbc-gray-light bg-sbc-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-sbc-gold">
              Super Admin
            </p>
            <h1 className="mt-1 text-xl font-bold text-sbc-black">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="text-xs font-semibold uppercase tracking-widest text-sbc-gray hover:text-sbc-gold-dark"
            >
              Admin
            </Link>
            <Button type="button" variant="ghost" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
