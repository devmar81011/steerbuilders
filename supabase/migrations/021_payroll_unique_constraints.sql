-- Prevent duplicate payroll rows when two saves happen concurrently.
create unique index if not exists payroll_runs_period_unique
  on public.payroll_runs (period_start, period_end);

create unique index if not exists payslips_run_employee_unique
  on public.payslips (payroll_run_id, employee_id);
