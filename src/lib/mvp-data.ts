import type { EmployeeCategory, EmployeeDesignation } from "@/lib/employee-categories";
import type { DeductionLine } from "@/lib/deduction-lines";
import type { RateType } from "@/lib/rate-types";

export type Employee = {
  id: string;
  employeeNumber: string;
  name: string;
  category: EmployeeCategory;
  designation: EmployeeDesignation;
  rate: number;
  rateType: RateType;
  status: "active" | "inactive";
  assignedSite?: string;
};

export type PayrollEntry = {
  id: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  siteAssignment: string;
  designation: string;
  category: EmployeeCategory;
  periodKey: string;
  period: string;
  dailyRate: number;
  hourlyRate: number;
  /** Regular hours for every payroll category. */
  hours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  grossPay: number;
  cashAdvance: number;
  additionalPay: number;
  deductions: number;
  /** Per-module amounts (SSS, PhilHealth, etc.). Recomputed from rules when empty. */
  deductionBreakdown?: DeductionLine[];
  netPay: number;
  disbursement: string;
  remarks: string;
  chargedTo: string;
  status: "draft" | "processed";
};

/** MVP mock data — replace with Supabase queries when DB is connected */
export const mockEmployees: Employee[] = [
  {
    id: "emp-001",
    employeeNumber: "SBC-001",
    name: "Juan Dela Cruz",
    category: "construction",
    designation: "Foreman",
    rate: 450,
    rateType: "daily",
    status: "active",
    assignedSite: "Main Site",
  },
  {
    id: "emp-002",
    employeeNumber: "SBC-002",
    name: "Maria Santos",
    category: "admin",
    designation: "Operations",
    rate: 406.25,
    rateType: "hourly",
    status: "active",
    assignedSite: "Head Office",
  },
  {
    id: "emp-003",
    employeeNumber: "SBC-003",
    name: "Pedro Reyes",
    category: "construction",
    designation: "Skilled",
    rate: 380,
    rateType: "daily",
    status: "active",
  },
  {
    id: "emp-004",
    employeeNumber: "SBC-004",
    name: "Ana Lopez",
    category: "admin",
    designation: "Finance/Admin",
    rate: 343.75,
    rateType: "hourly",
    status: "active",
    assignedSite: "Head Office",
  },
  {
    id: "emp-005",
    employeeNumber: "SBC-005",
    name: "Carlo Mendoza",
    category: "ojt",
    designation: "Trainee",
    rate: 150,
    rateType: "hourly",
    status: "active",
  },
];

export const mockPayroll: PayrollEntry[] = [
  {
    id: "pay-001",
    employeeId: "emp-001",
    employeeNumber: "SBC-001",
    employeeName: "Juan Dela Cruz",
    siteAssignment: "Main Site",
    designation: "Foreman",
    category: "construction",
    periodKey: "w-sample",
    period: "Weekly",
    dailyRate: 450,
    hourlyRate: 56.25,
    hours: 48,
    overtimeHours: 0,
    regularPay: 2700,
    overtimePay: 0,
    grossPay: 2700,
    cashAdvance: 0,
    additionalPay: 0,
    deductions: 324,
    netPay: 2376,
    disbursement: "Cash",
    remarks: "",
    chargedTo: "Main Site",
    status: "processed",
  },
  {
    id: "pay-003",
    employeeId: "emp-003",
    employeeNumber: "SBC-003",
    employeeName: "Pedro Reyes",
    siteAssignment: "",
    designation: "Skilled",
    category: "construction",
    periodKey: "w-sample",
    period: "Weekly",
    dailyRate: 380,
    hourlyRate: 47.5,
    hours: 40,
    overtimeHours: 0,
    regularPay: 1900,
    overtimePay: 0,
    grossPay: 1900,
    cashAdvance: 0,
    additionalPay: 0,
    deductions: 228,
    netPay: 1672,
    disbursement: "",
    remarks: "",
    chargedTo: "",
    status: "draft",
  },
  {
    id: "pay-002",
    employeeId: "emp-002",
    employeeNumber: "SBC-002",
    employeeName: "Maria Santos",
    siteAssignment: "Head Office",
    designation: "Operations",
    category: "admin",
    periodKey: "s-2026-07-1",
    period: "Jul 1 – 15, 2026",
    dailyRate: 3250,
    hourlyRate: 406.25,
    hours: 80,
    overtimeHours: 0,
    regularPay: 32500,
    overtimePay: 0,
    grossPay: 32500,
    cashAdvance: 0,
    additionalPay: 0,
    deductions: 3900,
    netPay: 28600,
    disbursement: "Bank transfer",
    remarks: "",
    chargedTo: "Administration",
    status: "processed",
  },
  {
    id: "pay-004",
    employeeId: "emp-004",
    employeeNumber: "SBC-004",
    employeeName: "Ana Lopez",
    siteAssignment: "Head Office",
    designation: "Finance/Admin",
    category: "admin",
    periodKey: "s-2026-07-1",
    period: "Jul 1 – 15, 2026",
    dailyRate: 2750,
    hourlyRate: 343.75,
    hours: 72,
    overtimeHours: 0,
    regularPay: 24750,
    overtimePay: 0,
    grossPay: 24750,
    cashAdvance: 0,
    additionalPay: 0,
    deductions: 2970,
    netPay: 21780,
    disbursement: "",
    remarks: "",
    chargedTo: "Administration",
    status: "draft",
  },
];

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}
