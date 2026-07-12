import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Section, SectionHeader } from "@/components/ui/section";
import { colors } from "@/lib/design-tokens";
import { company, mission } from "@/lib/company-content";

const swatches = [
  { name: "Black", token: "sbc-black", hex: colors.black, usage: "Headers, nav, dark sections" },
  { name: "Gray", token: "sbc-gray", hex: colors.gray, usage: "Body copy, secondary text" },
  { name: "Gray Light", token: "sbc-gray-light", hex: colors.grayLight, usage: "Borders, dividers" },
  { name: "Off White", token: "sbc-off-white", hex: colors.offWhite, usage: "Page backgrounds" },
  { name: "Gold", token: "sbc-gold", hex: colors.gold, usage: "Subheaders, accents, CTA, footer stripe" },
];

const sectionLabels = [
  "Company Profile",
  "Portfolio",
  "The Management",
  "Completed Projects",
  "Ongoing Projects",
];

export default function DesignSystemPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Section dark>
          <Link
            href="/"
            className="mb-6 inline-block text-xs font-medium uppercase tracking-widest text-sbc-gold hover:underline"
          >
            ← Back to Home
          </Link>
          <SectionHeader
            label="Proposal Design System"
            title={company.name}
            description="Client-facing design language aligned with the official company profile, brand style guide, and Next.js + Tailwind implementation."
            light
          />
          <div className="mt-8 flex items-center gap-6">
            <Image
              src="/brand/logo-full.png"
              alt={company.name}
              width={160}
              height={80}
              className="h-14 w-auto"
            />
            <p className="max-w-md text-sm font-semibold text-sbc-gray-light">
              {mission.body.slice(0, 120)}…
            </p>
          </div>
        </Section>

        <Section>
          <SectionHeader label="Voice & Tone" title="Brand Language" />
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <p className="text-xs font-medium uppercase tracking-widest text-sbc-gold">
                Mantra
              </p>
              <p className="mt-3 text-2xl font-bold text-sbc-black">{company.mantra}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium uppercase tracking-widest text-sbc-gold">
                Tone
              </p>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-sbc-gray">
                Professional, trustworthy, hands-on. Emphasize quality workmanship,
                personal service, and Cebu/regional leadership — matching the company
                profile proposal format.
              </p>
            </Card>
          </div>
        </Section>

        <Section>
          <SectionHeader label="Foundation" title="Color Palette" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {swatches.map((swatch) => (
              <div key={swatch.token}>
                <div
                  className="mb-3 aspect-square border border-sbc-gray-light"
                  style={{ backgroundColor: swatch.hex }}
                />
                <p className="text-sm font-bold">{swatch.name}</p>
                <p className="text-xs font-medium text-sbc-gray">{swatch.hex}</p>
                <p className="text-xs font-medium text-sbc-gold">{swatch.token}</p>
                <p className="mt-1 text-xs font-medium text-sbc-gray">{swatch.usage}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section>
          <SectionHeader label="Foundation" title="Typography" />
          <div className="space-y-8">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Display / Header — Montserrat Regular (uppercase)
              </p>
              <p className="bg-sbc-black px-6 py-4 text-3xl font-normal uppercase tracking-wide text-sbc-white md:text-4xl">
                Company Profile
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Subheader — Montserrat Bold (gold)
              </p>
              <p className="text-2xl font-bold text-sbc-gold">Our Vision</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Body — Montserrat Semi Bold
              </p>
              <p className="max-w-2xl text-base font-semibold leading-relaxed text-sbc-gray">
                We are committed to bring to life what our clients have visualized with
                very hands-on engineers who ensure execution is in accordance to the plan.
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Caption — Montserrat Medium
              </p>
              <p className="text-sm font-medium text-sbc-gray">
                Space 308 OneTree Plaza Hotel, R. Duterte St., Banawa, Cebu City
              </p>
            </div>
          </div>
        </Section>

        <Section>
          <SectionHeader label="Layout" title="Section Labels (from Company Profile PDF)" />
          <div className="flex flex-wrap gap-3">
            {sectionLabels.map((label) => (
              <Badge key={label}>{label}</Badge>
            ))}
          </div>
          <p className="mt-6 text-sm font-semibold text-sbc-gray">
            Use uppercase tracking-widest labels above gold subheaders. End major
            sections with the gold accent stripe (see footer).
          </p>
        </Section>

        <Section>
          <SectionHeader label="Components" title="UI Kit" />
          <div className="space-y-12">
            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Buttons
              </p>
              <div className="flex flex-wrap gap-4">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>
            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Status Badges (Portfolio)
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge>Completed</Badge>
                <Badge variant="dark">Ongoing</Badge>
                <Badge variant="light">Put on hold</Badge>
              </div>
            </div>
            <div className="max-w-md">
              <p className="mb-4 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Contact Form
              </p>
              <Input label="Email" placeholder={company.email} />
            </div>
          </div>
        </Section>

        <Section dark>
          <SectionHeader
            label="Implementation"
            title="Next.js + Tailwind"
            description="Tokens live in globals.css and src/lib/design-tokens.ts. Content sourced from src/lib/company-content.ts (company profile PDF)."
            light
          />
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
