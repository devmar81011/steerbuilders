export const ADMIN_TOUR_STORAGE_KEY = "sbc-admin-tour-completed";
export const ADMIN_TOUR_DISMISSED_KEY = "sbc-admin-tour-dismissed";
export const ADMIN_TOUR_SESSION_ACTIVE_KEY = "sbc-admin-tour-active";
export const ADMIN_TOUR_SESSION_STEP_KEY = "sbc-admin-tour-step";

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
    title: "Welcome",
    description:
      "This tour walks through admin in the order most teams use: rates, deductions, employees, attendance, then payroll. Use Next to move through each section.",
    navigateTo: "/admin",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description:
      "Your overview — active employees and pending payroll. Draft entries here still need to be processed under Payroll.",
    target: '[data-admin-tour="nav-dashboard"]',
    navigateTo: "/admin",
  },
  {
    id: "rates",
    title: "1 · Role Rate Defaults",
    description:
      "Optionally set suggested pay rates by category and role. These can prefill a new employee but never override that employee’s saved rate.",
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
      "Add workers and set each person’s rate and pay basis. A role default is optional and can be overridden.",
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
      "Follow that order whenever you run payroll. Tap the guide button at the bottom-right anytime for another walkthrough.",
    navigateTo: "/admin",
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

export function readTourSession(): { active: boolean; stepIndex: number } {
  if (typeof window === "undefined") {
    return { active: false, stepIndex: 0 };
  }

  const stepIndex = Number.parseInt(
    sessionStorage.getItem(ADMIN_TOUR_SESSION_STEP_KEY) ?? "0",
    10
  );

  return {
    active: sessionStorage.getItem(ADMIN_TOUR_SESSION_ACTIVE_KEY) === "true",
    stepIndex: Number.isFinite(stepIndex) ? stepIndex : 0,
  };
}

export function persistTourSession(active: boolean, stepIndex: number) {
  if (typeof window === "undefined") return;

  if (active) {
    sessionStorage.setItem(ADMIN_TOUR_SESSION_ACTIVE_KEY, "true");
    sessionStorage.setItem(ADMIN_TOUR_SESSION_STEP_KEY, String(stepIndex));
    return;
  }

  sessionStorage.removeItem(ADMIN_TOUR_SESSION_ACTIVE_KEY);
  sessionStorage.removeItem(ADMIN_TOUR_SESSION_STEP_KEY);
}
