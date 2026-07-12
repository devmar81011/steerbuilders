import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/ui/section";
import { getProjectsOrFallback } from "@/lib/actions/projects";

export async function FeaturedProjectsSection() {
  const portfolio = await getProjectsOrFallback();
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
          <Card key={project.id}>
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
        <ButtonLink href="/projects" variant="outline">
          View Full Portfolio
        </ButtonLink>
      </div>
    </Section>
  );
}
