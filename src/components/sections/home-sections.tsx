import Image from "next/image";
import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { getButtonClassName } from "@/components/ui/button-styles";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { HeroBackground } from "@/components/sections/hero-background";
import { company, services, proposalStats } from "@/lib/company-content";
import { ContactForm } from "@/components/sections/contact-form";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[calc(100svh-4.5rem)] items-center overflow-hidden bg-sbc-black text-sbc-white">
      <HeroBackground />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16 md:px-8 md:py-20">
        <div className="grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="text-center lg:text-left">
            <h1
              className="sbc-hero-rise text-4xl font-normal uppercase leading-tight tracking-wide md:text-5xl lg:text-6xl"
              style={{ "--sbc-hero-delay": "80ms" } as CSSProperties}
            >
              {company.name}
            </h1>
            <p
              className="sbc-hero-rise mt-4 text-2xl font-bold text-sbc-gold md:mt-5 md:text-3xl lg:text-4xl"
              style={{ "--sbc-hero-delay": "220ms" } as CSSProperties}
            >
              {company.mantra}
            </p>
            <p
              className="sbc-hero-rise mx-auto mt-5 max-w-xl text-base font-semibold leading-relaxed text-sbc-gray-light md:text-lg lg:mx-0"
              style={{ "--sbc-hero-delay": "380ms" } as CSSProperties}
            >
              {company.tagline}
            </p>
            <div
              className="sbc-hero-rise mt-8 flex flex-wrap justify-center gap-4 lg:justify-start"
              style={{ "--sbc-hero-delay": "540ms" } as CSSProperties}
            >
              <ButtonLink href="#contact" size="lg">
                Request a Proposal
              </ButtonLink>
              <ButtonLink href="/projects" variant="outline" tone="dark" size="lg">
                View Portfolio
              </ButtonLink>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <Image
              src="/brand/logo-full-mark.png"
              alt={company.name}
              width={420}
              height={460}
              className="sbc-hero-logo h-auto w-full max-w-[220px] sm:max-w-xs lg:max-w-sm"
              priority
              unoptimized
            />
          </div>
        </div>
      </div>
      <div className="sbc-gold-line absolute inset-x-0 bottom-0 z-10 h-1 bg-sbc-gold" />
    </section>
  );
}

export function ServicesSection() {
  return (
    <Section id="services">
      <Reveal>
        <SectionHeader
          label="Construction Services Offered"
          title="Our Services"
          description="From residential and commercial design-build to specialty trades and project management — executed with hands-on engineering oversight."
        />
      </Reveal>
      <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service, index) => (
          <Reveal key={service.title} delay={index * 120} className="h-full">
            <Card className="flex h-full flex-col transition-shadow hover:shadow-lg">
              <p className="text-xs font-medium uppercase tracking-widest text-sbc-gold">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 min-h-[3.25rem] text-lg font-bold leading-snug text-sbc-black md:min-h-[3.5rem]">
                {service.title}
              </h3>
              <p className="mt-3 flex-1 text-sm font-semibold leading-relaxed text-sbc-gray">
                {service.description}
              </p>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

export function StatsSection() {
  return (
    <section className="bg-sbc-off-white text-sbc-black">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="grid gap-5 border-y border-sbc-gray-light py-5 md:grid-cols-3 md:gap-6 md:py-6">
          {proposalStats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 140}>
              <div className="text-center md:text-left">
                <p className="text-3xl font-bold text-sbc-gold md:text-4xl">{stat.value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <Section id="contact" dark>
      <Reveal>
        <SectionHeader
          label="Get In Touch"
          title="Let's Build Your Vision"
          description="Reach out for project proposals, consultations, or general contractor engagements."
          light
        />
      </Reveal>
      <div className="grid gap-8 md:grid-cols-2">
        <Reveal>
          <div className="space-y-6 text-sm font-semibold text-sbc-gray-light">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-sbc-gold">
                Address
              </p>
              <a
                href={company.mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block hover:text-sbc-gold"
              >
                {company.address}
              </a>
              <a
                href={company.mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-medium uppercase tracking-widest text-sbc-gold hover:underline"
              >
                Open in Google Maps
              </a>
              <div className="mt-4 overflow-hidden rounded-md border border-sbc-gray/30">
                <iframe
                  title={`Map — ${company.address}`}
                  src={company.mapsEmbedSrc}
                  className="block h-48 w-full border-0 bg-sbc-black sm:h-56"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
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

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={company.phoneHref}
                className={getButtonClassName("primary", "sm", "dark")}
              >
                Call us
              </a>
              <a
                href={company.emailHref}
                className={getButtonClassName("outline", "sm", "dark")}
              >
                Email us
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <Card variant="dark" className="overflow-hidden border-sbc-gray/30 p-0">
            <div className="h-1 bg-linear-to-r from-sbc-gold via-[#d4a647] to-sbc-gold-dark" />
            <div className="p-6 md:p-8">
              <ContactForm />
            </div>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}
