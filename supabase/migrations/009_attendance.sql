-- Weekly attendance grid (Sun–Sat) per employee
create table if not exists public.attendance_weeks (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  week_start date not null,
  sun boolean not null default false,
  mon boolean not null default true,
  tue boolean not null default true,
  wed boolean not null default true,
  thu boolean not null default true,
  fri boolean not null default true,
  sat boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, week_start)
);

alter table public.attendance_weeks enable row level security;

create policy "Authenticated users can read attendance_weeks"
  on public.attendance_weeks for select to authenticated using (true);

create policy "Authenticated users can manage attendance_weeks"
  on public.attendance_weeks for all to authenticated using (true);
