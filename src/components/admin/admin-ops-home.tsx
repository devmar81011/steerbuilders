import Link from "next/link";
import { Card } from "@/components/ui/card";

const actions = [
  {
    href: "/admin/payroll?tab=construction",
    label: "Construction payroll",
    hint: "Weekly · paid Saturday",
    detail: "Upload the Construction Excel workbook, then print slips or export CSV.",
    cta: "Upload Construction →",
  },
  {
    href: "/admin/payroll?tab=admin",
    label: "Admin payroll",
    hint: "Semi-monthly · 15th / EOM",
    detail: "Upload the Admin payroll workbook, then print slips or export CSV.",
    cta: "Upload Admin →",
  },
  {
    href: "/admin/projects",
    label: "Projects",
    hint: "Portfolio & photos",
    detail: "Add or update featured projects and gallery photos for the public site.",
    cta: "Manage Projects →",
  },
] as const;

export function AdminOpsHome() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {actions.map((action) => (
        <Card
          key={action.href}
          className="flex h-full flex-col transition-colors hover:border-sbc-gold/50"
        >
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gold">
            {action.hint}
          </p>
          <h2 className="mt-3 text-xl font-bold text-sbc-black">{action.label}</h2>
          <p className="mt-3 flex-1 text-sm font-semibold leading-relaxed text-sbc-gray">
            {action.detail}
          </p>
          <Link
            href={action.href}
            className="mt-6 inline-flex text-xs font-bold uppercase tracking-[0.14em] text-sbc-gold-dark hover:underline"
          >
            {action.cta}
          </Link>
        </Card>
      ))}
    </div>
  );
}
