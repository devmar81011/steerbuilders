-- Admin hourly attendance (time in / time out per day, stored as JSON)
create table if not exists public.admin_attendance_weeks (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  week_start date not null,
  times jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, week_start)
);

alter table public.admin_attendance_weeks enable row level security;

create policy "Authenticated users can read admin_attendance_weeks"
  on public.admin_attendance_weeks for select to authenticated using (true);

create policy "Authenticated users can manage admin_attendance_weeks"
  on public.admin_attendance_weeks for all to authenticated using (true);
