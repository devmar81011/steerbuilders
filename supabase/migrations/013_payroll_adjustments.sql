-- Statutory deductions configuration (SSS, PhilHealth, Pag-IBIG)
create table if not exists public.payroll_adjustments (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'deduction' check (kind = 'deduction'),
  code text not null unique,
  label text not null,
  calc_type text not null check (
    calc_type in ('percent_of_gross', 'fixed_per_period')
  ),
  value numeric(12, 4) not null default 0,
  active boolean not null default true,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payroll_adjustments enable row level security;

create policy "Authenticated users can read payroll_adjustments"
  on public.payroll_adjustments for select to authenticated using (true);

create policy "Authenticated users can manage payroll_adjustments"
  on public.payroll_adjustments for all to authenticated using (true);

insert into public.payroll_adjustments (
  id, code, label, calc_type, value, active, description, sort_order
) values
  (
    '00000000-0000-4000-8000-000000000001',
    'sss', 'SSS', 'fixed_per_period', 600, true,
    'Employee SSS contribution. Real amounts follow the SSS contribution table by salary bracket.',
    1
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'philhealth', 'PhilHealth', 'percent_of_gross', 2.5, true,
    'Employee share of PhilHealth premium (~50% of total ~5% premium).',
    2
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'pagibig', 'Pag-IBIG', 'fixed_per_period', 200, true,
    'Employee Pag-IBIG share — commonly ₱100–₱200 or up to 2% of monthly compensation.',
    3
  )
on conflict (code) do nothing;
