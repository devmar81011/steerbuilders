import { AdminShell } from "@/components/layout/admin-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const modules = [
  {
    title: "Dashboard",
    route: "/admin",
    status: "Built",
    description: "KPI cards: active employees, net pay, pending runs, quick actions.",
  },
  {
    title: "Projects",
    route: "/admin/projects",
    status: "Built",
    description: "CRUD for portfolio projects. Seed from PDF, toggle featured, sync to public /projects.",
  },
  {
    title: "Employees",
    route: "/admin/employees",
    status: "In progress",
    description: "Add/edit workers, hourly vs salary rates, active status.",
  },
  {
    title: "Payroll",
    route: "/admin/payroll",
    status: "In progress",
    description: "Pay period runs, gross/deductions/net pay, process & export payslips.",
  },
  {
    title: "Content Reviewer",
    route: "/admin/review",
    status: "Built",
    description: "Agent checks site copy vs company profile PDF after every update.",
  },
  {
    title: "Sign In",
    route: "/admin/login",
    status: "Planned",
    description: "Supabase Auth — admin-only access.",
  },
];

export default function AdminDesignPage() {
  return (
    <AdminShell>
      <div className="mb-10">
        <Badge>Admin UI Design Spec</Badge>
        <h1 className="mt-4 text-3xl font-bold text-sbc-gold">Payroll & Projects Admin</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-sbc-gray">
          Client proposal admin panel for Steer Builders Corporation. Matches public site
          design system: black sidebar, gold accents, Montserrat typography, card-based
          layouts on off-white canvas.
        </p>
      </div>

      <div className="mb-10 grid gap-6 lg:grid-cols-[240px_1fr]">
        <Card variant="dark" className="border-sbc-gray/30">
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gold">Sidebar</p>
          <ul className="mt-4 space-y-2 text-sm font-medium text-sbc-gray-light">
            <li className="bg-sbc-gold px-3 py-2 text-sbc-white">Dashboard</li>
            <li className="px-3 py-2">Projects</li>
            <li className="px-3 py-2">Employees</li>
            <li className="px-3 py-2">Payroll</li>
            <li className="px-3 py-2">PDF Review</li>
            <li className="px-3 py-2">Design Spec</li>
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
              Top bar
            </p>
            <div className="mt-3 flex items-center justify-between border border-sbc-gray-light px-4 py-3">
              <span className="text-sm font-semibold">Steer Builders — Payroll System</span>
              <span className="text-xs font-medium uppercase tracking-widest text-sbc-gold">
                Sign In
              </span>
            </div>
          </Card>

          <Card>
            <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
              Dashboard layout
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {["Active Employees", "Net Pay", "Pending Runs"].map((label) => (
                <div key={label} className="border border-sbc-gray-light p-4">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-sbc-gray">
                    {label}
                  </p>
                  <p className="mt-2 text-xl font-bold text-sbc-gold">—</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
              Projects table (admin)
            </p>
            <div className="mt-3 overflow-hidden border border-sbc-gray-light">
              <div className="grid grid-cols-4 gap-2 bg-sbc-off-white px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-sbc-gray">
                <span>Project</span>
                <span>Scope</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              <div className="grid grid-cols-4 gap-2 border-t border-sbc-gray-light px-3 py-3 text-xs font-semibold">
                <span>Dr. Sanchez Residence</span>
                <span>General Contractor</span>
                <span className="text-sbc-gold">Completed</span>
                <span>Edit · Delete</span>
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
              Payroll table (admin)
            </p>
            <div className="mt-3 overflow-hidden border border-sbc-gray-light">
              <div className="grid grid-cols-5 gap-2 bg-sbc-off-white px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-sbc-gray">
                <span>Employee</span>
                <span>Hours</span>
                <span>Gross</span>
                <span>Net</span>
                <span>Status</span>
              </div>
              <div className="grid grid-cols-5 gap-2 border-t border-sbc-gray-light px-3 py-3 text-xs font-semibold">
                <span>Juan Dela Cruz</span>
                <span>88h</span>
                <span>₱39,600</span>
                <span className="text-sbc-gold">₱34,848</span>
                <span>Processed</span>
              </div>
            </div>
            <Button size="sm" className="mt-4">
              Process Payroll Run
            </Button>
          </Card>
        </div>
      </div>

      <SectionModules />
    </AdminShell>
  );
}

function SectionModules() {
  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-sbc-black">Module Status</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((mod) => (
          <Card key={mod.title}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold">{mod.title}</h3>
              <Badge variant={mod.status === "Built" ? "gold" : "light"}>{mod.status}</Badge>
            </div>
            <p className="mt-2 text-sm font-semibold text-sbc-gray">{mod.description}</p>
            <p className="mt-2 text-xs font-medium text-sbc-gold">{mod.route}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
