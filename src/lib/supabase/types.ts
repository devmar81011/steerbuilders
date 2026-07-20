export type ProjectRow = {
  id: string;
  name: string;
  scope: string;
  location: string;
  status: string;
  completion: string;
  description: string | null;
  featured: boolean;
  category: "completed" | "ongoing" | null;
  images: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProjectInput = {
  name: string;
  scope: string;
  location: string;
  status: ProjectRow["status"];
  completion: string;
  description?: string;
  featured?: boolean;
  category?: ProjectRow["category"];
  images?: string[];
  sort_order?: number;
};

import type { EmployeeCategory } from "@/lib/employee-categories";
import type { RateType } from "@/lib/rate-types";
import type { AttendanceDayValue } from "@/lib/attendance";

export type EmployeeRow = {
  id: string;
  employee_number: string;
  name: string;
  category: EmployeeCategory;
  designation: string;
  assigned_site: string | null;
  rate: number;
  rate_type: RateType;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

export type AttendanceWeekRow = {
  id: string;
  employee_id: string;
  week_start: string;
  sun: AttendanceDayValue;
  mon: AttendanceDayValue;
  tue: AttendanceDayValue;
  wed: AttendanceDayValue;
  thu: AttendanceDayValue;
  fri: AttendanceDayValue;
  sat: AttendanceDayValue;
  created_at: string;
  updated_at: string;
};

export type AdminAttendanceWeekRow = {
  id: string;
  employee_id: string;
  week_start: string;
  times: Record<string, { timeIn?: string; timeOut?: string }>;
  created_at: string;
  updated_at: string;
};

export type PayslipRow = {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  hours: number;
  site_assignment: string;
  overtime_hours: number;
  regular_pay: number;
  overtime_pay: number;
  gross_pay: number;
  cash_advance: number;
  additional_pay: number;
  deductions: number;
  net_pay: number;
  disbursement: string;
  remarks: string;
  charged_to: string;
  status: "draft" | "processed";
  created_at: string;
};
