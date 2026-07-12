import Image from "next/image";
import Link from "next/link";
import { company } from "@/lib/company-content";

export function SiteFooter() {
  return (
    <footer className="border-t-4 border-sbc-gold bg-sbc-black text-sbc-white">
      <div className="mx-auto max-w-6xl px-6 py-12 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <Image
              src="/brand/logo-full.png"
              alt={company.name}
              width={200}
              height={90}
              className="h-16 w-auto"
            />
            <p className="mt-4 max-w-sm text-sm font-semibold text-sbc-gray-light">
              {company.mantra}
            </p>
            <p className="mt-4 text-sm font-medium text-sbc-gray">{company.address}</p>
            <p className="mt-2 text-sm font-medium">
              <a href={company.phoneHref} className="hover:text-sbc-gold">
                {company.phone}
              </a>
            </p>
            <p className="text-sm font-medium">
              <a href={company.emailHref} className="hover:text-sbc-gold">
                {company.email}
              </a>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-sbc-gold">
                Company
              </p>
              <ul className="space-y-2 text-sm font-medium text-sbc-gray-light">
                <li><Link href="/about" className="hover:text-sbc-gold">About</Link></li>
                <li><Link href="/projects" className="hover:text-sbc-gold">Portfolio</Link></li>
                <li><Link href="/#contact" className="hover:text-sbc-gold">Contact</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-sbc-gold">
                Resources
              </p>
              <ul className="space-y-2 text-sm font-medium text-sbc-gray-light">
                <li><Link href="/design-system" className="hover:text-sbc-gold">Design System</Link></li>
                <li><Link href="/mvp" className="hover:text-sbc-gold">MVP Roadmap</Link></li>
                <li><Link href="/admin" className="hover:text-sbc-gold">Admin</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-sbc-gray/30 pt-6 text-center text-xs font-medium text-sbc-gray">
          © {new Date().getFullYear()} {company.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
