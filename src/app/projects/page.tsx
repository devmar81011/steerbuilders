import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ProjectsPortfolioTable } from "@/components/projects/projects-portfolio-table";
import { ButtonLink } from "@/components/ui/button-link";
import { Section, SectionHeader } from "@/components/ui/section";
import { getProjectsOrFallback } from "@/lib/actions/projects";
import { isCompletedProject, isOngoingProject } from "@/lib/project-status";

type Filter = "all" | "Completed" | "Ongoing";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = (params.filter as Filter) || "all";
  const portfolio = await getProjectsOrFallback();

  const filtered =
    filter === "all"
      ? portfolio
      : portfolio.filter((p) =>
          filter === "Ongoing" ? isOngoingProject(p) : isCompletedProject(p)
        );

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All Projects" },
    { key: "Completed", label: "Completed" },
    { key: "Ongoing", label: "Ongoing" },
  ];

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
            label="Portfolio"
            title="Project Portfolio"
            description="Completed and ongoing projects across residential, commercial, and augmentation works."
            light
          />
        </Section>

        <Section>
          <div className="mb-8 flex flex-wrap gap-4">
            {tabs.map((tab) => (
              <ButtonLink
                key={tab.key}
                href={`/projects?filter=${tab.key}`}
                variant={filter === tab.key ? "primary" : "outline"}
                size="sm"
              >
                {tab.label}
              </ButtonLink>
            ))}
          </div>

          <ProjectsPortfolioTable
            projects={filtered}
            filterLabel={filter !== "all" ? filter : ""}
          />
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
