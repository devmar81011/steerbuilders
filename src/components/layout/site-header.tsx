"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IconButton } from "@/components/ui/icon-button";

const navLinks = [
  { href: "/#services", label: "Services" },
  { href: "/projects", label: "Portfolio" },
  { href: "/about", label: "About" },
  { href: "/#contact", label: "Contact" },
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

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-sbc-gray-light/20 bg-sbc-black">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-sbc-black/60 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col border-l border-sbc-gray-light/20 bg-sbc-black transition-transform duration-200 md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gold">
            Menu
          </p>
          <IconButton
            label="Close menu"
            size="lg"
            onClick={() => setMobileMenuOpen(false)}
          >
            <CloseIcon />
          </IconButton>
        </div>
        <nav className="flex flex-col gap-1 px-6 pb-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="border-l-2 border-transparent py-3 pl-4 text-xs font-medium uppercase tracking-widest text-sbc-gray-light transition-colors hover:border-sbc-gold hover:text-sbc-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/logo-sbc.png"
            alt="SBC"
            width={48}
            height={48}
            className="h-10 w-auto md:h-12"
            priority
          />
          <div className="hidden sm:block">
            <p className="text-sm font-normal uppercase tracking-[0.2em] text-sbc-white">
              Steer Builders
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-sbc-gold">
              Corporation
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-medium uppercase tracking-widest text-sbc-gray-light transition-colors hover:text-sbc-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="md:hidden">
          <IconButton
            label="Open menu"
            size="lg"
            onClick={() => setMobileMenuOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
