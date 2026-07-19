-- Employee rates are authoritative; role rates are optional defaults.
-- Expand accepted pay bases without changing existing rows.
alter table public.employees
  drop constraint if exists employees_rate_type_check;

alter table public.daily_rates
  drop constraint if exists daily_rates_rate_type_check;

alter table public.employees
  add constraint employees_rate_type_check
  check (rate_type in ('hourly', 'daily', 'monthly'));

alter table public.daily_rates
  add constraint daily_rates_rate_type_check
  check (rate_type in ('hourly', 'daily', 'monthly'));

-- Existing legacy rows may have a blank number. Enforce uniqueness once assigned.
create unique index if not exists employees_employee_number_unique
  on public.employees (employee_number)
  where employee_number <> '';
