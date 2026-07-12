-- Steer Builders MVP schema
-- Apply via Supabase Dashboard SQL editor or: supabase db push

-- Employees
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'construction' check (category in ('construction', 'admin')),
  role text not null,
  rate numeric(12, 2) not null,
  rate_type text not null check (rate_type in ('hourly', 'salary')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Payroll runs (period batches)
create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft', 'processed')),
  created_at timestamptz not null default now()
);

-- Individual payslips per employee per run
create table if not exists public.payslips (
  id uuid primary key default gen_random_uuid(),
  payroll_run_id uuid not null references public.payroll_runs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete restrict,
  hours numeric(8, 2) not null default 0,
  gross_pay numeric(12, 2) not null,
  deductions numeric(12, 2) not null default 0,
  net_pay numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.employees enable row level security;
alter table public.payroll_runs enable row level security;
alter table public.payslips enable row level security;

-- Only authenticated admin users (extend when auth roles are defined)
create policy "Authenticated users can read employees"
  on public.employees for select to authenticated using (true);

create policy "Authenticated users can manage employees"
  on public.employees for all to authenticated using (true);

create policy "Authenticated users can read payroll_runs"
  on public.payroll_runs for select to authenticated using (true);

create policy "Authenticated users can manage payroll_runs"
  on public.payroll_runs for all to authenticated using (true);

create policy "Authenticated users can read payslips"
  on public.payslips for select to authenticated using (true);

create policy "Authenticated users can manage payslips"
  on public.payslips for all to authenticated using (true);
