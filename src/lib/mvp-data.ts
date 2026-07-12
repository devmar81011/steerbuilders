export type Employee = {
  id: string;
  name: string;
  role: string;
  rate: number;
  rateType: "hourly" | "salary";
  status: "active" | "inactive";
};

export type PayrollEntry = {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  hours: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: "draft" | "processed";
};

/** MVP mock data — replace with Supabase queries when DB is connected */
export const mockEmployees: Employee[] = [
  {
    id: "emp-001",
    name: "Juan Dela Cruz",
    role: "Site Foreman",
    rate: 450,
    rateType: "hourly",
    status: "active",
  },
  {
    id: "emp-002",
    name: "Maria Santos",
    role: "Project Manager",
    rate: 65000,
    rateType: "salary",
    status: "active",
  },
  {
    id: "emp-003",
    name: "Pedro Reyes",
    role: "Mason",
    rate: 380,
    rateType: "hourly",
    status: "active",
  },
  {
    id: "emp-004",
    name: "Ana Lopez",
    role: "Accountant",
    rate: 55000,
    rateType: "salary",
    status: "active",
  },
];

export const mockPayroll: PayrollEntry[] = [
  {
    id: "pay-001",
    employeeId: "emp-001",
    employeeName: "Juan Dela Cruz",
    period: "Jul 1–15, 2026",
    hours: 88,
    grossPay: 39600,
    deductions: 4752,
    netPay: 34848,
    status: "processed",
  },
  {
    id: "pay-002",
    employeeId: "emp-002",
    employeeName: "Maria Santos",
    period: "Jul 1–15, 2026",
    hours: 80,
    grossPay: 32500,
    deductions: 3900,
    netPay: 28600,
    status: "processed",
  },
  {
    id: "pay-003",
    employeeId: "emp-003",
    employeeName: "Pedro Reyes",
    period: "Jul 1–15, 2026",
    hours: 92,
    grossPay: 34960,
    deductions: 4195,
    netPay: 30765,
    status: "draft",
  },
];

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}
