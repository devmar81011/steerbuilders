-- Per role overrides for deduction modules
create table if not exists public.payroll_adjustment_role_rates (
  id uuid primary key default gen_random_uuid(),
  adjustment_id uuid not null references public.payroll_adjustments(id) on delete cascade,
  category text not null check (category in ('construction', 'admin', 'ojt')),
  role text not null,
  value numeric(12, 4) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (adjustment_id, category, role)
);

alter table public.payroll_adjustment_role_rates enable row level security;

create policy "Authenticated users can read payroll_adjustment_role_rates"
  on public.payroll_adjustment_role_rates for select to authenticated using (true);

create policy "Authenticated users can manage payroll_adjustment_role_rates"
  on public.payroll_adjustment_role_rates for all to authenticated using (true);
