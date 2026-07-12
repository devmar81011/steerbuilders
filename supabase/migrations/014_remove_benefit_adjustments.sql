delete from public.payroll_adjustments where kind = 'benefit';

alter table public.payroll_adjustments
  drop column if exists employee_paid;

alter table public.payroll_adjustments
  drop constraint if exists payroll_adjustments_kind_check;

alter table public.payroll_adjustments
  add constraint payroll_adjustments_kind_check check (kind = 'deduction');

alter table public.payroll_adjustments
  drop constraint if exists payroll_adjustments_calc_type_check;

alter table public.payroll_adjustments
  add constraint payroll_adjustments_calc_type_check check (
    calc_type in ('percent_of_gross', 'fixed_per_period')
  );
