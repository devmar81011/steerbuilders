-- Rate type: hourly (admin) and daily (construction)
alter table public.employees drop constraint if exists employees_rate_type_check;
alter table public.daily_rates drop constraint if exists daily_rates_rate_type_check;

update public.employees
set rate_type = 'daily'
where rate_type = 'hourly' and category = 'construction';

update public.employees
set rate_type = 'hourly', rate = round(rate / 160, 2)
where rate_type = 'salary';

update public.daily_rates
set rate_type = 'daily'
where rate_type = 'hourly' and category = 'construction';

update public.daily_rates
set rate_type = 'hourly', rate = round(rate / 160, 2)
where rate_type = 'salary';

alter table public.employees
  add constraint employees_rate_type_check
  check (rate_type in ('hourly', 'daily'));

alter table public.daily_rates
  add constraint daily_rates_rate_type_check
  check (rate_type in ('hourly', 'daily'));
