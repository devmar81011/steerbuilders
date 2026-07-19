alter table if exists public.employees
  add column if not exists employee_number text not null default '';

alter table if exists public.payslips
  add column if not exists site_assignment text not null default '',
  add column if not exists overtime_hours numeric(8, 2) not null default 0,
  add column if not exists regular_pay numeric(12, 2) not null default 0,
  add column if not exists overtime_pay numeric(12, 2) not null default 0,
  add column if not exists cash_advance numeric(12, 2) not null default 0,
  add column if not exists additional_pay numeric(12, 2) not null default 0,
  add column if not exists disbursement text not null default '',
  add column if not exists remarks text not null default '',
  add column if not exists charged_to text not null default '';

-- Before this format, construction payslips stored days in `hours`.
update public.payslips as payslip
set hours = payslip.hours * 8
from public.employees as employee
where employee.id = payslip.employee_id
  and employee.category = 'construction'
  and payslip.regular_pay = 0
  and payslip.overtime_pay = 0
  and payslip.gross_pay <> 0;

-- Existing records did not split gross pay into regular and overtime portions.
update public.payslips
set regular_pay = gross_pay
where regular_pay = 0
  and overtime_pay = 0
  and gross_pay <> 0;

comment on column public.payslips.hours is
  'Regular hours worked; construction attendance days are converted to eight hours each.';
