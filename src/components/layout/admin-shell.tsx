"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/lib/actions/auth";
import { IconButton } from "@/components/ui/icon-button";

const navItems = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/attendance", label: "Attendance" },
  { href: "/admin/payroll", label: "Payroll" },
  { href: "/admin/account", label: "Account" },
];

function MenuIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="block h-[1em] w-[1em]">
      <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="block h-[1em] w-[1em]">
      <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
    </svg>
  );
}

function AdminNavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-1">
      {navItems.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={`block border-l-2 px-4 py-2.5 text-xs font-medium uppercase tracking-widest transition-colors ${
                active
                  ? "border-sbc-gold bg-sbc-gold/10 text-sbc-gold-dark"
                  : "border-transparent text-sbc-gray hover:border-sbc-gold/40 hover:bg-sbc-gold/5 hover:text-sbc-gold-dark"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <div className="flex min-h-screen bg-sbc-off-white">
      <aside className="hidden w-64 flex-col border-r border-sbc-gray-light bg-sbc-white md:flex">
        <div className="border-b border-sbc-gray-light p-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/brand/logo-sbc-mark.png"
              alt="SBC"
              width={40}
              height={40}
              className="h-9 w-auto"
              unoptimized
            />
            <div>
              <p className="text-xs font-normal uppercase tracking-widest text-sbc-black">
                Admin
              </p>
              <p className="text-[10px] font-medium text-sbc-gold">Payroll System</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <AdminNavLinks pathname={pathname} />
        </nav>

        <div className="border-t border-sbc-gray-light p-4">
          <Link
            href="/"
            className="block px-4 py-2 text-xs font-medium uppercase tracking-widest text-sbc-gray hover:text-sbc-gold-dark"
          >
            ← Public Site
          </Link>
        </div>
      </aside>

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-sbc-black/40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-sbc-gray-light bg-sbc-white transition-transform duration-200 md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="flex items-center justify-between border-b border-sbc-gray-light p-4">
          <Link
            href="/admin"
            className="flex items-center gap-3"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Image
              src="/brand/logo-sbc-mark.png"
              alt="SBC"
              width={36}
              height={36}
              className="h-9 w-auto"
              unoptimized
            />
            <div>
              <p className="text-xs font-normal uppercase tracking-widest text-sbc-black">
                Admin
              </p>
              <p className="text-[10px] font-medium text-sbc-gold">Payroll System</p>
            </div>
          </Link>
          <IconButton
            label="Close menu"
            size="lg"
            onClick={() => setMobileMenuOpen(false)}
          >
            <CloseIcon />
          </IconButton>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <AdminNavLinks
            pathname={pathname}
            onNavigate={() => setMobileMenuOpen(false)}
          />
        </nav>

        <div className="border-t border-sbc-gray-light p-4">
          <Link
            href="/"
            className="block px-4 py-2 text-xs font-medium uppercase tracking-widest text-sbc-gray hover:text-sbc-gold-dark"
            onClick={() => setMobileMenuOpen(false)}
          >
            ← Public Site
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-sbc-gray-light bg-sbc-white px-4 py-4 md:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <div className="md:hidden">
              <IconButton
                label="Open menu"
                size="lg"
                onClick={() => setMobileMenuOpen(true)}
              >
                <MenuIcon />
              </IconButton>
            </div>
            <Link href="/admin" className="md:hidden">
              <Image
                src="/brand/logo-sbc-mark.png"
                alt="SBC Admin"
                width={36}
                height={36}
                unoptimized
              />
            </Link>
            <p className="hidden truncate text-sm font-semibold text-sbc-black sm:block">
              Steer Builders — Payroll System
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <form action={logout}>
              <button
                type="submit"
                className="cursor-pointer text-xs font-medium uppercase tracking-widest text-sbc-gold hover:underline"
              >
                Sign Out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
