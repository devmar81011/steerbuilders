import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ProjectsPortfolioCards } from "@/components/projects/projects-portfolio-cards";
import { Section, SectionHeader } from "@/components/ui/section";
import { getProjectsOrFallback } from "@/lib/actions/projects";
import { isCompletedProject, isOngoingProject } from "@/lib/project-status";

type Filter = "all" | "Completed" | "Ongoing";

function parseFilter(value: string | undefined): Filter {
  if (value === "Completed" || value === "Ongoing") return value;
  return "all";
}

export const metadata: Metadata = {
  title: "Project Portfolio",
  description:
    "Browse completed and ongoing Steer Builders Corporation projects across residential, commercial, and augmentation works in Cebu and beyond.",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const portfolio = await getProjectsOrFallback();

  const completedCount = portfolio.filter((p) => isCompletedProject(p)).length;
  const ongoingCount = portfolio.filter((p) => isOngoingProject(p)).length;

  const filtered =
    filter === "all"
      ? portfolio
      : portfolio.filter((p) =>
          filter === "Ongoing" ? isOngoingProject(p) : isCompletedProject(p)
        );

  const tabs: { key: Filter; label: string; hint: string }[] = [
    {
      key: "all",
      label: "All Projects",
      hint: `${portfolio.length} total`,
    },
    {
      key: "Completed",
      label: "Completed",
      hint: `${completedCount} projects`,
    },
    {
      key: "Ongoing",
      label: "Ongoing",
      hint: `${ongoingCount} projects`,
    },
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
          <div className="mb-0">
            <div
              role="tablist"
              aria-label="Portfolio filter"
              className="flex flex-wrap items-end gap-1"
            >
              {tabs.map((tab) => {
                const active = filter === tab.key;
                return (
                  <Link
                    key={tab.key}
                    href={`/projects?filter=${tab.key}`}
                    role="tab"
                    aria-selected={active}
                    className={`-mb-px rounded-t-md border px-3 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sbc-gold/35 ${
                      active
                        ? "border-sbc-gray-light border-b-sbc-white bg-sbc-white text-sbc-black"
                        : "border-transparent bg-sbc-off-white text-sbc-gray hover:bg-sbc-white/80 hover:text-sbc-black"
                    }`}
                  >
                    <span
                      className={`block text-[11px] font-bold uppercase tracking-[0.12em] ${
                        active ? "text-sbc-gold-dark" : ""
                      }`}
                    >
                      {tab.label}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-medium text-sbc-gray">
                      {tab.hint}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="rounded-b-lg rounded-tr-lg border border-sbc-gray-light bg-sbc-white p-4 sm:p-5">
              <ProjectsPortfolioCards
                projects={filtered}
                filterLabel={filter !== "all" ? filter : ""}
              />
            </div>
          </div>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
