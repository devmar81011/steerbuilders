/**
 * Single source of truth for MVP feature status.
 * Update this file whenever features ship — /mvp page reads from here automatically.
 */
export type FeatureStatus = "done" | "in_progress" | "planned";

export type MvpFeature = {
  id: string;
  name: string;
  status: FeatureStatus;
  route?: string;
  notes?: string;
};

export type MvpPhase = {
  id: string;
  name: string;
  features: MvpFeature[];
};

export const MVP_VERSION = "0.4.0";

export const MVP_UPDATED = "2026-07-12";

export const mvpPhases: MvpPhase[] = [
  {
    id: "public",
    name: "Public Website",
    features: [
      {
        id: "home",
        name: "Homepage",
        status: "done",
        route: "/",
        notes: "Company profile content — story, vision, mission, services, portfolio",
      },
      {
        id: "design-system",
        name: "Proposal Design System",
        status: "done",
        route: "/design-system",
        notes: "Aligned with company profile PDF + brand style guide",
      },
      {
        id: "about",
        name: "About Page",
        status: "done",
        route: "/about",
        notes: "Story, vision, mission, management team",
      },
      {
        id: "projects",
        name: "Projects Portfolio",
        status: "done",
        route: "/projects",
        notes: "Full portfolio table from company profile",
      },
    ],
  },
  {
    id: "admin",
    name: "Admin & Payroll",
    features: [
      {
        id: "admin-dashboard",
        name: "Admin Dashboard",
        status: "in_progress",
        route: "/admin",
        notes: "Overview stats and quick actions",
      },
      {
        id: "admin-login",
        name: "Admin Login (Supabase Auth)",
        status: "in_progress",
        route: "/admin/login",
      },
      {
        id: "employees",
        name: "Employee Management",
        status: "in_progress",
        route: "/admin/employees",
        notes: "MVP uses mock data until Supabase is wired",
      },
      {
        id: "payroll",
        name: "Payroll Runs",
        status: "in_progress",
        route: "/admin/payroll",
        notes: "Calculate and view payslips",
      },
      {
        id: "projects-db",
        name: "Projects in Database",
        status: "in_progress",
        route: "/admin/projects",
        notes: "Supabase projects table + seed from PDF",
      },
      {
        id: "content-reviewer",
        name: "PDF Content Reviewer Agent",
        status: "done",
        route: "/admin/review",
      },
      {
        id: "admin-design",
        name: "Admin Design Spec",
        status: "done",
        route: "/admin/design",
      },
    ],
  },
  {
    id: "infra",
    name: "Infrastructure",
    features: [
      {
        id: "github",
        name: "GitHub Repository",
        status: "done",
        notes: "devmar81011/steerbuilders",
      },
      {
        id: "vercel",
        name: "Vercel Auto-Deploy",
        status: "done",
        notes: "Deploys on every push to main",
      },
      {
        id: "supabase",
        name: "Supabase Database",
        status: "in_progress",
        notes: "Schema ready — connect env vars to activate",
      },
      {
        id: "figma",
        name: "Figma Design Sync",
        status: "planned",
        notes: "Via Figma MCP when connected",
      },
    ],
  },
];

export function getMvpProgress() {
  const all = mvpPhases.flatMap((p) => p.features);
  const done = all.filter((f) => f.status === "done").length;
  const inProgress = all.filter((f) => f.status === "in_progress").length;
  const planned = all.filter((f) => f.status === "planned").length;
  return { total: all.length, done, inProgress, planned, percent: Math.round((done / all.length) * 100) };
}
