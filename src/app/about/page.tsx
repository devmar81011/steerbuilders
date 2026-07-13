import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { story, vision, mission, management, company } from "@/lib/company-content";

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Section dark className="min-h-[calc(100svh-4.5rem)] flex flex-col justify-center">
          <Link
            href="/"
            className="mb-6 inline-block text-xs font-medium uppercase tracking-widest text-sbc-gold hover:underline"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-normal uppercase leading-tight tracking-wide text-sbc-white md:text-5xl lg:text-6xl">
            {company.name}
          </h1>
          <p className="mt-4 text-2xl font-bold text-sbc-gold md:mt-5 md:text-3xl">
            {company.mantra}
          </p>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-sbc-gray-light md:text-lg">
            {company.tagline}
          </p>
        </Section>

        <Section>
          <SectionHeader title={story.title} />
          <p className="max-w-3xl text-base font-semibold leading-relaxed text-sbc-gray">
            {story.body}
          </p>
        </Section>

        <Section>
          <div className="grid gap-10 md:grid-cols-2">
            <Card>
              <h2 className="text-xl font-bold text-sbc-gold">{vision.title}</h2>
              <p className="mt-4 text-sm font-semibold leading-relaxed text-sbc-gray">
                {vision.body}
              </p>
            </Card>
            <Card>
              <h2 className="text-xl font-bold text-sbc-gold">{mission.title}</h2>
              <p className="mt-4 text-sm font-semibold leading-relaxed text-sbc-gray">
                {mission.body}
              </p>
            </Card>
          </div>
        </Section>

        <Section dark id="management">
          <SectionHeader
            label="The Management"
            title="Leadership Team"
            description="Experienced leadership combining engineering excellence and financial governance."
            light
          />
          <div className="grid gap-8 md:grid-cols-2">
            {management.map((leader) => (
              <Card key={leader.name} variant="dark" className="border-sbc-gray/30">
                <p className="text-xs font-medium uppercase tracking-widest text-sbc-gold">
                  {leader.title}
                </p>
                <h3 className="mt-2 text-xl font-bold text-sbc-white">{leader.name}</h3>
                <p className="mt-4 whitespace-pre-line text-sm font-semibold leading-relaxed text-sbc-gray-light">
                  {leader.bio}
                </p>
              </Card>
            ))}
          </div>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
