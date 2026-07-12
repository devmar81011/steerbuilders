"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Section, SectionHeader } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { portfolio } from "@/lib/company-content";

type Filter = "all" | "Completed" | "Ongoing";

export default function ProjectsPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all"
      ? portfolio
      : portfolio.filter((p) =>
          filter === "Ongoing"
            ? p.status === "Ongoing" || p.status === "Put on hold in 2025"
            : p.status === "Completed"
        );

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
          <div className="mb-8 flex flex-wrap gap-3">
            {(["all", "Completed", "Ongoing"] as Filter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`px-4 py-2 text-xs font-medium uppercase tracking-widest transition-colors ${
                  filter === item
                    ? "bg-sbc-gold text-sbc-white"
                    : "border border-sbc-gray-light text-sbc-gray hover:border-sbc-gold hover:text-sbc-gold"
                }`}
              >
                {item === "all" ? "All Projects" : item}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto border border-sbc-gray-light bg-sbc-white">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-sbc-gray-light bg-sbc-off-white">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                    Project
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                    Scope of Work
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                    Location
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                    Completion
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => (
                  <tr
                    key={`${project.name}-${project.location}`}
                    className="border-b border-sbc-gray-light"
                  >
                    <td className="px-4 py-3 font-semibold">{project.name}</td>
                    <td className="px-4 py-3 font-medium text-sbc-gray">{project.scope}</td>
                    <td className="px-4 py-3 font-medium text-sbc-gray">{project.location}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          project.status === "Completed"
                            ? "gold"
                            : project.status === "Ongoing"
                              ? "dark"
                              : "light"
                        }
                      >
                        {project.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">{project.completion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
