-- Tag payroll uploads by workforce category (construction weekly vs admin semi-monthly)
alter table public.payroll_uploads
  add column if not exists category text not null default 'construction';

create index if not exists payroll_uploads_category_idx
  on public.payroll_uploads (category);
