import type { EmployeeCategory, EmployeeRole } from "@/lib/employee-categories";
import type { DeductionLine } from "@/lib/deduction-lines";
import type { RateType } from "@/lib/rate-types";

export type Employee = {
  id: string;
  name: string;
  category: EmployeeCategory;
  role: EmployeeRole;
  rate: number;
  rateType: RateType;
  status: "active" | "inactive";
};

export type PayrollEntry = {
  id: string;
  employeeId: string;
  employeeName: string;
  category: EmployeeCategory;
  periodKey: string;
  period: string;
  /** Admin: hours from time in/out. Construction: stored as days worked. */
  hours: number;
  grossPay: number;
  deductions: number;
  /** Per-module amounts (SSS, PhilHealth, etc.). Recomputed from rules when empty. */
  deductionBreakdown?: DeductionLine[];
  netPay: number;
  status: "draft" | "processed";
};

/** MVP mock data — replace with Supabase queries when DB is connected */
export const mockEmployees: Employee[] = [
  {
    id: "emp-001",
    name: "Juan Dela Cruz",
    category: "construction",
    role: "Foreman",
    rate: 450,
    rateType: "daily",
    status: "active",
  },
  {
    id: "emp-002",
    name: "Maria Santos",
    category: "admin",
    role: "Operations",
    rate: 406.25,
    rateType: "hourly",
    status: "active",
  },
  {
    id: "emp-003",
    name: "Pedro Reyes",
    category: "construction",
    role: "Skilled",
    rate: 380,
    rateType: "daily",
    status: "active",
  },
  {
    id: "emp-004",
    name: "Ana Lopez",
    category: "admin",
    role: "Finance/Admin",
    rate: 343.75,
    rateType: "hourly",
    status: "active",
  },
  {
    id: "emp-005",
    name: "Carlo Mendoza",
    category: "ojt",
    role: "Trainee",
    rate: 150,
    rateType: "hourly",
    status: "active",
  },
];

export const mockPayroll: PayrollEntry[] = [
  {
    id: "pay-001",
    employeeId: "emp-001",
    employeeName: "Juan Dela Cruz",
    category: "construction",
    periodKey: "w-sample",
    period: "Weekly",
    hours: 6,
    grossPay: 2700,
    deductions: 324,
    netPay: 2376,
    status: "processed",
  },
  {
    id: "pay-003",
    employeeId: "emp-003",
    employeeName: "Pedro Reyes",
    category: "construction",
    periodKey: "w-sample",
    period: "Weekly",
    hours: 5,
    grossPay: 1900,
    deductions: 228,
    netPay: 1672,
    status: "draft",
  },
  {
    id: "pay-002",
    employeeId: "emp-002",
    employeeName: "Maria Santos",
    category: "admin",
    periodKey: "s-2026-07-1",
    period: "Jul 1 – 15, 2026",
    hours: 80,
    grossPay: 32500,
    deductions: 3900,
    netPay: 28600,
    status: "processed",
  },
  {
    id: "pay-004",
    employeeId: "emp-004",
    employeeName: "Ana Lopez",
    category: "admin",
    periodKey: "s-2026-07-1",
    period: "Jul 1 – 15, 2026",
    hours: 72,
    grossPay: 24750,
    deductions: 2970,
    netPay: 21780,
    status: "draft",
  },
];

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}
