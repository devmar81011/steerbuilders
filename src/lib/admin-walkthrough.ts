export const ADMIN_TOUR_STORAGE_KEY = "sbc-admin-tour-completed";
export const ADMIN_TOUR_DISMISSED_KEY = "sbc-admin-tour-dismissed";

export type AdminTourStep = {
  id: string;
  title: string;
  description: string;
  /** CSS selector for the highlighted target, if any */
  target?: string;
  /** Nav href to open before showing this step (optional) */
  navigateTo?: string;
};

export const adminTourSteps: AdminTourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Steer Builders Admin",
    description:
      "This quick guide walks through payroll and site management in the order most teams use. You can replay it anytime from the Guide button in the header.",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description:
      "See active employees and pending payroll at a glance. Draft entries here mean someone still needs to be processed in Payroll.",
    target: '[data-admin-tour="nav-dashboard"]',
    navigateTo: "/admin",
  },
  {
    id: "rates",
    title: "1 · Daily Rates",
    description:
      "Start here. Set pay rates by category and role (construction, admin, OJT). New employees pull their rate from this list.",
    target: '[data-admin-tour="nav-rates"]',
    navigateTo: "/admin/rates",
  },
  {
    id: "contributions",
    title: "2 · Statutory Deductions",
    description:
      "Configure SSS, PhilHealth, Pag-IBIG, and other deductions. Payroll uses these rules when calculating net pay.",
    target: '[data-admin-tour="nav-contributions"]',
    navigateTo: "/admin/contributions",
  },
  {
    id: "employees",
    title: "3 · Employees",
    description:
      "Add workers and assign a category and role. Each employee must match a rate you defined in Daily Rates.",
    target: '[data-admin-tour="nav-employees"]',
    navigateTo: "/admin/employees",
  },
  {
    id: "attendance",
    title: "4 · Attendance",
    description:
      "Mark days worked (construction) or hours (admin/OJT) each week. Payroll auto-fills from this data.",
    target: '[data-admin-tour="nav-attendance"]',
    navigateTo: "/admin/attendance",
  },
  {
    id: "payroll",
    title: "5 · Payroll",
    description:
      "Review calculated gross pay and deductions, adjust if needed, then Process to finalize each payslip for the period.",
    target: '[data-admin-tour="nav-payroll"]',
    navigateTo: "/admin/payroll",
  },
  {
    id: "projects",
    title: "Projects & homepage",
    description:
      "Manage your portfolio and choose which projects appear on the public site. Set the featured limit to control the homepage gallery.",
    target: '[data-admin-tour="nav-projects"]',
    navigateTo: "/admin/projects",
  },
  {
    id: "account",
    title: "Account",
    description:
      "Change your admin password here. Use a strong password and sign out when you're done on a shared device.",
    target: '[data-admin-tour="nav-account"]',
    navigateTo: "/admin/account",
  },
  {
    id: "done",
    title: "You're all set",
    description:
      "Follow the numbered flow above whenever you run payroll. Open Guide again from the header if you need a refresher.",
  },
];

export function hasCompletedAdminTour(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ADMIN_TOUR_STORAGE_KEY) === "true";
}

export function hasDismissedAdminTourPrompt(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ADMIN_TOUR_DISMISSED_KEY) === "true";
}

export function markAdminTourCompleted() {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_TOUR_STORAGE_KEY, "true");
}

export function dismissAdminTourPrompt() {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_TOUR_DISMISSED_KEY, "true");
}
