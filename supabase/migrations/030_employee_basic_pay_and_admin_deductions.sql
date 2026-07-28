-- Basic pay for employees + PhilHealth based on basic pay (admin statutory).
alter table public.employees
  add column if not exists basic_pay numeric(12, 2);

alter table public.payroll_adjustments
  drop constraint if exists payroll_adjustments_calc_type_check;

alter table public.payroll_adjustments
  add constraint payroll_adjustments_calc_type_check
  check (calc_type = any (array[
    'percent_of_gross'::text,
    'percent_of_basic'::text,
    'fixed_per_period'::text
  ]));

-- Pag-IBIG: fixed ₱200
update public.payroll_adjustments
set
  calc_type = 'fixed_per_period',
  value = 200,
  active = true,
  description = 'Employee Pag-IBIG share — fixed ₱200 per pay run (admin).',
  updated_at = now()
where code = 'pagibig';

-- PhilHealth: 5% of basic pay ÷ 2 (= 2.5% of basic)
update public.payroll_adjustments
set
  calc_type = 'percent_of_basic',
  value = 2.5,
  active = true,
  description = 'Employee PhilHealth share — 5% of basic pay divided by 2 (admin).',
  updated_at = now()
where code = 'philhealth';

-- SSS: leave empty for now
update public.payroll_adjustments
set
  value = 0,
  active = false,
  description = 'Employee SSS contribution — leave empty until contribution table is set.',
  updated_at = now()
where code = 'sss';
