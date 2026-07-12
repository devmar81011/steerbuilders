import Image from "next/image";
import { ButtonLink } from "@/components/ui/button-link";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import {
  company,
  story,
  vision,
  mission,
  services,
  proposalStats,
} from "@/lib/company-content";
import { ContactForm } from "@/components/sections/contact-form";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-sbc-black text-sbc-white">
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-8 md:py-14">
        <div className="grid w-full items-center gap-8 md:grid-cols-2 md:gap-10 lg:gap-14">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-normal uppercase leading-tight tracking-wide md:text-5xl lg:text-[3.25rem]">
              {company.name}
            </h1>
            <p className="mt-3 text-2xl font-bold text-sbc-gold md:mt-4 md:text-3xl">
              {company.mantra}
            </p>
            <p className="mx-auto mt-4 max-w-xl text-base font-semibold leading-relaxed text-sbc-gray-light md:mx-0 md:mt-5">
              {company.tagline}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4 md:mt-7 md:justify-start">
              <ButtonLink href="#contact" size="lg">
                Request a Proposal
              </ButtonLink>
              <ButtonLink href="/projects" variant="outline" tone="dark" size="lg">
                View Portfolio
              </ButtonLink>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <Image
              src="/brand/logo-full.png"
              alt={company.name}
              width={420}
              height={320}
              className="w-full max-w-xs sm:max-w-sm md:max-w-md"
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
      <SectionHeader title={story.title} />
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

        <Card variant="dark" className="overflow-hidden border-sbc-gray/30 p-0">
          <div className="h-1 bg-linear-to-r from-sbc-gold via-[#d4a647] to-sbc-gold-dark" />
          <div className="p-6 md:p-8">
            <ContactForm />
          </div>
        </Card>
      </div>
    </Section>
  );
}
