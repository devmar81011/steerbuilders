-- Track uploaded construction payroll Excel files for history
create table if not exists public.payroll_uploads (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  sheet_name text not null default '',
  period_key text not null,
  period_start date not null,
  period_end date not null,
  period_label text not null,
  row_count integer not null default 0,
  payroll_run_id uuid references public.payroll_runs(id) on delete set null,
  uploaded_at timestamptz not null default now()
);

create index if not exists payroll_uploads_period_key_idx
  on public.payroll_uploads (period_key);

create index if not exists payroll_uploads_uploaded_at_idx
  on public.payroll_uploads (uploaded_at desc);

alter table public.payroll_uploads enable row level security;

create policy "Authenticated users can read payroll_uploads"
  on public.payroll_uploads for select to authenticated using (true);

create policy "Authenticated users can manage payroll_uploads"
  on public.payroll_uploads for all to authenticated using (true);
