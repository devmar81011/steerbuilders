import { type ReactNode } from "react";
import { radii } from "@/lib/design-tokens";

type TableShellProps = {
  children: ReactNode;
  className?: string;
  minWidth?: string;
  scrollable?: boolean;
  maxHeight?: string;
};

export function TableShell({
  children,
  className = "",
  minWidth = "800px",
  scrollable = false,
  maxHeight = "520px",
}: TableShellProps) {
  const forceMinWidth = minWidth && minWidth !== "0";

  return (
    <div className={`overflow-hidden ${radii.surface} border border-sbc-gray-light/80 ${className}`}>
      <div
        className={scrollable ? "overflow-auto" : "overflow-x-auto"}
        style={scrollable ? { maxHeight } : undefined}
      >
        <div style={forceMinWidth ? { minWidth } : { width: "100%" }}>{children}</div>
      </div>
    </div>
  );
}

export function Table({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <table className={`w-full border-collapse text-left text-sm ${className}`}>
      {children}
    </table>
  );
}

export function TableHeader({
  children,
  sticky = true,
}: {
  children: ReactNode;
  sticky?: boolean;
}) {
  return (
    <thead className={sticky ? "sticky top-0 z-10 bg-sbc-white" : ""}>
      {children}
    </thead>
  );
}

export function TableHead({
  children,
  className = "",
  align = "left",
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  const alignClass =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <th
      className={`border-b border-sbc-gray-light px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-sbc-gray ${alignClass} ${className}`}
    >
      {children}
    </th>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-sbc-gray-light/60">{children}</tbody>;
}

export function TableRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <tr className={`group ${className}`}>{children}</tr>;
}

export function TableCell({
  children,
  className = "",
  align = "left",
  emphasis = false,
  numeric = false,
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  emphasis?: boolean;
  numeric?: boolean;
}) {
  const alignClass =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <td
      className={`px-6 py-4 align-middle ${alignClass} ${
        numeric ? "tabular-nums" : ""
      } ${
        emphasis ? "font-semibold text-sbc-black" : "font-medium text-sbc-gray"
      } ${className}`}
    >
      {children}
    </td>
  );
}

export function TablePrimaryCell({
  children,
  subtitle,
}: {
  children: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <TableCell emphasis className="!text-sbc-black">
      <p className="font-semibold text-sbc-black">{children}</p>
      {subtitle && (
        <p className="mt-1 text-xs font-medium text-sbc-gray">{subtitle}</p>
      )}
    </TableCell>
  );
}

export function TableEmpty({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-6 py-16 text-center text-sm font-medium text-sbc-gray"
      >
        {message}
      </td>
    </tr>
  );
}

export function TableMeta({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-sbc-gray-light/80 px-6 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray ${className}`}
    >
      {children}
    </div>
  );
}
