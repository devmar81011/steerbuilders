import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/#services", label: "Services" },
  { href: "/projects", label: "Portfolio" },
  { href: "/about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-sbc-gray-light/20 bg-sbc-black">
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

        <div className="flex items-center gap-3">
          <Link href="/design-system" className="hidden lg:block">
            <Button variant="ghost" size="sm">
              Design System
            </Button>
          </Link>
          <Link href="/#contact">
            <Button size="sm">Get a Quote</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
