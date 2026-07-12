"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MVP_VERSION } from "@/lib/mvp-status";

const navItems = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/payroll", label: "Payroll" },
  { href: "/admin/review", label: "PDF Review" },
  { href: "/admin/design", label: "Design Spec" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-sbc-off-white">
      <aside className="hidden w-64 flex-col border-r border-sbc-gray-light bg-sbc-black text-sbc-white md:flex">
        <div className="border-b border-sbc-gray/30 p-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/brand/logo-sbc.png"
              alt="SBC"
              width={40}
              height={40}
              className="h-9 w-auto"
            />
            <div>
              <p className="text-xs font-normal uppercase tracking-widest">Admin</p>
              <p className="text-[10px] font-medium text-sbc-gold">MVP v{MVP_VERSION}</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block px-4 py-3 text-xs font-medium uppercase tracking-widest transition-colors ${
                      active
                        ? "bg-sbc-gold text-sbc-white"
                        : "text-sbc-gray-light hover:bg-sbc-gray/20 hover:text-sbc-gold"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-sbc-gray/30 p-4">
          <Link
            href="/"
            className="block px-4 py-2 text-xs font-medium uppercase tracking-widest text-sbc-gray hover:text-sbc-gold"
          >
            ← Public Site
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-sbc-gray-light bg-sbc-white px-6 py-4 md:px-8">
          <div className="md:hidden">
            <Link href="/admin">
              <Image
                src="/brand/logo-sbc.png"
                alt="SBC Admin"
                width={36}
                height={36}
              />
            </Link>
          </div>
          <p className="text-sm font-semibold text-sbc-black">
            Steer Builders — Payroll System
          </p>
          <Link
            href="/admin/login"
            className="text-xs font-medium uppercase tracking-widest text-sbc-gold hover:underline"
          >
            Sign In
          </Link>
        </header>

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
