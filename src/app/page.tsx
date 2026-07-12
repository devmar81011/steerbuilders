import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import {
  HeroSection,
  StorySection,
  VisionMissionSection,
  ServicesSection,
  StatsSection,
  FeaturedProjectsSection,
  ContactSection,
} from "@/components/sections/home-sections";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <StorySection />
        <VisionMissionSection />
        <ServicesSection />
        <StatsSection />
        <FeaturedProjectsSection />
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  );
}
