import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import {
  ContactSection,
  HeroSection,
  ServicesSection,
  StatsSection,
} from "@/components/sections/home-sections";
import { FeaturedProjectsSection } from "@/components/sections/featured-projects";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <ServicesSection />
        <StatsSection />
        <FeaturedProjectsSection />
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  );
}
