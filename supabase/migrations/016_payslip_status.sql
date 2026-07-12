alter table public.payslips
  add column if not exists status text not null default 'draft'
  check (status in ('draft', 'processed'));
