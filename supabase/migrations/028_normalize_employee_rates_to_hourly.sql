-- Store all employee rates as hourly. Convert legacy daily/monthly amounts
-- so payroll math stays the same (daily / 8, monthly / (26 * 8)).
update public.employees
set
  rate = case
    when rate_type = 'daily' then round(rate / 8, 2)
    when rate_type = 'monthly' then round(rate / (26 * 8), 2)
    when rate_type = 'salary' then round(rate / (26 * 8), 2)
    else rate
  end,
  rate_type = 'hourly'
where coalesce(rate_type, '') <> 'hourly';
