"use client";

import { type ReactNode } from "react";
import type { SortDirection } from "@/lib/table-sort";

type Props = {
  children: ReactNode;
  sortKey: string;
  activeKey: string | null;
  direction: SortDirection;
  onSort: (key: string) => void;
  align?: "left" | "right" | "center";
  className?: string;
  sortable?: boolean;
};

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  if (!active) {
    return (
      <span className="ml-1 inline-flex flex-col gap-0.5 opacity-40">
        <span className="block h-0 w-0 border-x-[3px] border-b-[4px] border-x-transparent border-b-current" />
        <span className="block h-0 w-0 border-x-[3px] border-t-[4px] border-x-transparent border-t-current" />
      </span>
    );
  }

  return (
    <span className="ml-1 text-sbc-gold" aria-hidden>
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

export function SortableTableHead({
  children,
  sortKey,
  activeKey,
  direction,
  onSort,
  align = "left",
  className = "",
  sortable = true,
}: Props) {
  const alignClass =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  if (!sortable) {
    return (
      <th
        className={`border-b border-sbc-gray-light px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-sbc-gray ${alignClass} ${className}`}
      >
        {children}
      </th>
    );
  }

  const active = activeKey === sortKey;

  return (
    <th
      className={`border-b border-sbc-gray-light px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] ${alignClass} ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex cursor-pointer items-center gap-0.5 rounded-md px-1 py-0.5 transition-colors hover:text-sbc-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sbc-gold/30 ${
          active ? "text-sbc-gold-dark" : "text-sbc-gray"
        } ${align === "right" ? "float-right" : align === "center" ? "mx-auto" : ""}`}
        aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
      >
        <span>{children}</span>
        <SortIndicator active={active} direction={direction} />
      </button>
    </th>
  );
}
