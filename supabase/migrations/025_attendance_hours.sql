-- Change construction attendance from boolean to hours tracking
-- Each day now stores { hours: number, overtimeHours: number }

alter table public.attendance_weeks
  drop column if exists sun,
  drop column if exists mon,
  drop column if exists tue,
  drop column if exists wed,
  drop column if exists thu,
  drop column if exists fri,
  drop column if exists sat;

alter table public.attendance_weeks
  add column if not exists sun jsonb not null default '{"hours": 0, "overtimeHours": 0}',
  add column if not exists mon jsonb not null default '{"hours": 8, "overtimeHours": 0}',
  add column if not exists tue jsonb not null default '{"hours": 8, "overtimeHours": 0}',
  add column if not exists wed jsonb not null default '{"hours": 8, "overtimeHours": 0}',
  add column if not exists thu jsonb not null default '{"hours": 8, "overtimeHours": 0}',
  add column if not exists fri jsonb not null default '{"hours": 8, "overtimeHours": 0}',
  add column if not exists sat jsonb not null default '{"hours": 8, "overtimeHours": 0}';
