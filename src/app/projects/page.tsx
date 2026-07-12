import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Section, SectionHeader } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableMeta,
  TablePrimaryCell,
  TableRow,
  TableShell,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { getProjectsOrFallback } from "@/lib/actions/projects";
import { getStatusBadgeVariant, isCompletedProject, isOngoingProject } from "@/lib/project-status";

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

          <TableShell minWidth="960px" scrollable maxHeight="640px">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Project</TableHead>
                  <TableHead>Scope of Work</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead align="right">Completion</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableEmpty
                    colSpan={5}
                    message="No projects match this filter."
                  />
                ) : (
                  filtered.map((project) => (
                    <TableRow key={`${project.id}-${project.name}`}>
                      <TablePrimaryCell subtitle={project.scope}>
                        {project.name}
                      </TablePrimaryCell>
                      <TableCell className="max-w-xs !text-sbc-gray">
                        {project.scope}
                      </TableCell>
                      <TableCell className="!text-sbc-gray">{project.location}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(project.status, project.category)}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell
                        align="right"
                        numeric
                        className="!font-semibold !text-sbc-black"
                      >
                        {project.completion}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TableMeta>
              <span>
                {filtered.length} project{filtered.length === 1 ? "" : "s"}
                {filter !== "all" ? ` · ${filter}` : ""}
              </span>
              <span className="text-sbc-gold">Steer Builders Portfolio</span>
            </TableMeta>
          </TableShell>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
