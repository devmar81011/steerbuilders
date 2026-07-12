import { type ReactNode } from "react";

type TableShellProps = {
  children: ReactNode;
  className?: string;
  minWidth?: string;
  /** Sticky header + scroll body for long lists */
  scrollable?: boolean;
  maxHeight?: string;
};

/** Premium table container — gold accent stripe, shadow, optional scroll */
export function TableShell({
  children,
  className = "",
  minWidth = "800px",
  scrollable = false,
  maxHeight = "520px",
}: TableShellProps) {
  return (
    <div
      className={`overflow-hidden border border-sbc-gray-light/80 bg-sbc-white shadow-[0_10px_40px_-16px_rgba(16,16,16,0.18)] ${className}`}
    >
      <div className="h-1 bg-linear-to-r from-sbc-gold via-[#d4a647] to-sbc-gold-dark" />
      <div
        className={scrollable ? "overflow-auto" : "overflow-x-auto"}
        style={scrollable ? { maxHeight } : undefined}
      >
        <div style={{ minWidth }}>{children}</div>
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
    <thead
      className={`bg-sbc-off-white ${
        sticky ? "sticky top-0 z-10 shadow-[0_1px_0_0_rgba(184,143,63,0.2)]" : ""
      }`}
    >
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
      className={`border-b border-sbc-gold/30 bg-sbc-off-white px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-sbc-gold-dark ${alignClass} ${className}`}
    >
      {children}
    </th>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-sbc-gray-light/70">{children}</tbody>;
}

export function TableRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={`group transition-colors odd:bg-sbc-off-white/60 even:bg-sbc-white hover:bg-sbc-gold/[0.06] ${className}`}
    >
      {children}
    </tr>
  );
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
  /** Tabular figures for amounts, dates, counts */
  numeric?: boolean;
}) {
  const alignClass =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <td
      className={`px-6 py-4 align-middle ${alignClass} ${
        numeric ? "tabular-nums" : ""
      } ${
        emphasis
          ? "font-bold text-sbc-black"
          : "font-medium text-sbc-gray group-hover:text-sbc-black"
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
    <TableCell emphasis className="relative !text-sbc-black">
      <span className="absolute inset-y-3 left-0 w-0.5 scale-y-0 bg-sbc-gold transition-transform group-hover:scale-y-100" />
      <div className="pl-2">
        <p className="font-semibold text-sbc-black">{children}</p>
        {subtitle && (
          <p className="mt-1 text-xs font-medium text-sbc-gray">{subtitle}</p>
        )}
      </div>
    </TableCell>
  );
}

export function TableEmpty({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-6 py-16 text-center text-sm font-semibold text-sbc-gray"
      >
        {message}
      </td>
    </tr>
  );
}

/** Footer bar — row counts, totals, pagination hints */
export function TableMeta({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-sbc-gray-light/80 bg-sbc-off-white/80 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-sbc-gray ${className}`}
    >
      {children}
    </div>
  );
}
