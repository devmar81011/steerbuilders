-- Add OJT employee category
alter table public.employees drop constraint if exists employees_category_check;
alter table public.daily_rates drop constraint if exists daily_rates_category_check;

alter table public.employees
  add constraint employees_category_check
  check (category in ('construction', 'admin', 'ojt'));

alter table public.daily_rates
  add constraint daily_rates_category_check
  check (category in ('construction', 'admin', 'ojt'));

insert into public.daily_rates (category, role, rate, rate_type) values
  ('ojt', 'Trainee', 150, 'hourly')
on conflict (category, role) do nothing;
