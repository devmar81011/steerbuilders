"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHeader,
  TableMeta,
  TablePrimaryCell,
  TableRow,
  TableShell,
} from "@/components/ui/table";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { getStatusLabelClass } from "@/lib/project-status";
import { sortRows, useTableSort } from "@/lib/table-sort";
import type { ProjectRow } from "@/lib/supabase/types";

type SortKey = "name" | "scope" | "location" | "status";

type Props = {
  projects: ProjectRow[];
  filterLabel: string;
};

export function ProjectsPortfolioTable({ projects, filterLabel }: Props) {
  const { sort, toggleSort } = useTableSort<SortKey>({ defaultKey: "name" });

  const sorted = useMemo(
    () =>
      sortRows(projects, sort, (row, key) => {
        if (key === "name") return row.name;
        if (key === "scope") return row.scope;
        if (key === "location") return row.location;
        return row.status;
      }),
    [projects, sort]
  );

  return (
    <TableShell minWidth="960px" scrollable maxHeight="640px">
      <Table>
        <TableHeader>
          <tr>
            <SortableTableHead
              sortKey="name"
              activeKey={sort.key}
              direction={sort.direction}
              onSort={(key) => toggleSort(key as SortKey)}
            >
              Project
            </SortableTableHead>
            <SortableTableHead
              sortKey="scope"
              activeKey={sort.key}
              direction={sort.direction}
              onSort={(key) => toggleSort(key as SortKey)}
            >
              Scope of Work
            </SortableTableHead>
            <SortableTableHead
              sortKey="location"
              activeKey={sort.key}
              direction={sort.direction}
              onSort={(key) => toggleSort(key as SortKey)}
            >
              Location
            </SortableTableHead>
            <SortableTableHead
              sortKey="status"
              activeKey={sort.key}
              direction={sort.direction}
              onSort={(key) => toggleSort(key as SortKey)}
            >
              Status
            </SortableTableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableEmpty colSpan={4} message="No projects match this filter." />
          ) : (
            sorted.map((project) => (
              <TableRow key={`${project.id}-${project.name}`}>
                <TablePrimaryCell subtitle={project.scope}>
                  {project.name}
                </TablePrimaryCell>
                <TableCell className="max-w-xs !text-sbc-gray">{project.scope}</TableCell>
                <TableCell className="!text-sbc-gray">{project.location}</TableCell>
                <TableCell>
                  <span
                    className={`text-xs uppercase tracking-widest ${getStatusLabelClass(project.status, project.category)}`}
                  >
                    {project.status}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <TableMeta>
        <span>
          {sorted.length} project{sorted.length === 1 ? "" : "s"}
          {filterLabel ? ` · ${filterLabel}` : ""}
        </span>
        <span className="text-sbc-gold">Steer Builders Portfolio</span>
      </TableMeta>
    </TableShell>
  );
}
