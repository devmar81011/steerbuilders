export type ProjectRow = {
  id: string;
  name: string;
  scope: string;
  location: string;
  status: "Completed" | "Ongoing" | "Put on hold in 2025";
  completion: string;
  description: string | null;
  featured: boolean;
  category: "completed" | "ongoing" | null;
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
  sort_order?: number;
};

export type EmployeeRow = {
  id: string;
  name: string;
  role: string;
  rate: number;
  rate_type: "hourly" | "salary";
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

export type PayslipRow = {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  hours: number;
  gross_pay: number;
  deductions: number;
  net_pay: number;
  created_at: string;
};
