import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import {
  company,
  story,
  vision,
  mission,
  services,
  proposalStats,
  portfolio,
} from "@/lib/company-content";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-sbc-black text-sbc-white">
      <div className="relative mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <Badge variant="gold">Company Profile</Badge>
            <h1 className="mt-6 text-4xl font-normal uppercase leading-tight tracking-wide md:text-5xl">
              {company.name}
            </h1>
            <p className="mt-4 text-2xl font-bold text-sbc-gold md:text-3xl">
              {company.mantra}
            </p>
            <p className="mt-6 max-w-xl text-base font-semibold leading-relaxed text-sbc-gray-light">
              {company.tagline}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="#contact">
                <Button size="lg">Request a Proposal</Button>
              </Link>
              <Link href="/projects">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-sbc-white text-sbc-white hover:bg-sbc-white hover:text-sbc-black"
                >
                  View Portfolio
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <Image
              src="/brand/logo-full.png"
              alt={company.name}
              width={420}
              height={320}
              className="w-full max-w-sm md:max-w-md"
              priority
            />
          </div>
        </div>
      </div>
      <div className="h-1 bg-sbc-gold" />
    </section>
  );
}

export function StorySection() {
  return (
    <Section id="about">
      <SectionHeader label="Company Profile" title={story.title} />
      <p className="max-w-3xl text-base font-semibold leading-relaxed text-sbc-gray">
        {story.body}
      </p>
    </Section>
  );
}

export function VisionMissionSection() {
  return (
    <Section dark>
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold text-sbc-gold">{vision.title}</h2>
          <p className="mt-4 text-base font-semibold leading-relaxed text-sbc-gray-light">
            {vision.body}
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-sbc-gold">{mission.title}</h2>
          <p className="mt-4 text-base font-semibold leading-relaxed text-sbc-gray-light">
            {mission.body}
          </p>
        </div>
      </div>
    </Section>
  );
}

export function ServicesSection() {
  return (
    <Section id="services">
      <SectionHeader
        label="Construction Services Offered"
        title="Our Services"
        description="From residential and commercial design-build to specialty trades and project management — executed with hands-on engineering oversight."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service, index) => (
          <Card key={service.title} className="transition-shadow hover:shadow-lg">
            <p className="text-xs font-medium uppercase tracking-widest text-sbc-gold">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-3 text-lg font-bold text-sbc-black">{service.title}</h3>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-sbc-gray">
              {service.description}
            </p>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export function StatsSection() {
  return (
    <Section>
      <div className="grid gap-8 border-y border-sbc-gray-light py-10 md:grid-cols-3">
        {proposalStats.map((stat) => (
          <div key={stat.label} className="text-center md:text-left">
            <p className="text-4xl font-bold text-sbc-gold md:text-5xl">{stat.value}</p>
            <p className="mt-2 text-sm font-medium uppercase tracking-widest text-sbc-gray">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function FeaturedProjectsSection() {
  const featured = portfolio.filter((p) => p.featured);

  return (
    <Section id="projects">
      <SectionHeader
        label="Portfolio"
        title="Featured Projects"
        description="A selection of completed and ongoing engagements across Cebu, Bohol, Iloilo, and Cagayan de Oro."
      />
      <div className="grid gap-6 md:grid-cols-2">
        {featured.map((project) => (
          <Card key={project.name + project.location}>
            <div className="mb-3 flex items-center justify-between gap-4">
              <Badge variant={project.status === "Completed" ? "gold" : "dark"}>
                {project.status}
              </Badge>
              <span className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
                {project.completion}
              </span>
            </div>
            <h3 className="text-lg font-bold text-sbc-black">{project.name}</h3>
            <p className="mt-2 text-sm font-semibold text-sbc-gold">{project.scope}</p>
            <p className="mt-2 text-sm font-medium text-sbc-gray">{project.location}</p>
            {project.description && (
              <p className="mt-4 text-sm font-semibold leading-relaxed text-sbc-gray">
                {project.description}
              </p>
            )}
          </Card>
        ))}
      </div>
      <div className="mt-8">
        <Link href="/projects">
          <Button variant="outline">View Full Portfolio</Button>
        </Link>
      </div>
    </Section>
  );
}

export function ContactSection() {
  return (
    <Section id="contact" dark>
      <SectionHeader
        label="Get In Touch"
        title="Let's Build Your Vision"
        description="Reach out for project proposals, consultations, or general contractor engagements."
        light
      />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6 text-sm font-semibold text-sbc-gray-light">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-sbc-gold">
              Address
            </p>
            <p className="mt-2">{company.address}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-sbc-gold">
              Phone
            </p>
            <a href={company.phoneHref} className="mt-2 block hover:text-sbc-gold">
              {company.phone}
            </a>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-sbc-gold">
              Email
            </p>
            <a href={company.emailHref} className="mt-2 block hover:text-sbc-gold">
              {company.email}
            </a>
          </div>
        </div>

        <Card variant="dark" className="border-sbc-gray/30">
          <form className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Full Name"
              className="border border-sbc-gray/40 bg-sbc-black px-4 py-3 text-sm font-medium text-sbc-white placeholder:text-sbc-gray focus:border-sbc-gold focus:outline-none"
            />
            <input
              type="email"
              placeholder="Email Address"
              className="border border-sbc-gray/40 bg-sbc-black px-4 py-3 text-sm font-medium text-sbc-white placeholder:text-sbc-gray focus:border-sbc-gold focus:outline-none"
            />
            <textarea
              placeholder="Tell us about your project..."
              rows={4}
              className="border border-sbc-gray/40 bg-sbc-black px-4 py-3 text-sm font-medium text-sbc-white placeholder:text-sbc-gray focus:border-sbc-gold focus:outline-none"
            />
            <Button type="button" className="self-start">
              Send Inquiry
            </Button>
          </form>
        </Card>
      </div>
    </Section>
  );
}
