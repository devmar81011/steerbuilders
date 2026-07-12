-- Daily rate schedule by category and role
create table if not exists public.daily_rates (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('construction', 'admin')),
  role text not null,
  rate numeric(12, 2) not null,
  rate_type text not null check (rate_type in ('hourly', 'salary')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category, role)
);

alter table public.daily_rates enable row level security;

create policy "Authenticated users can read daily_rates"
  on public.daily_rates for select to authenticated using (true);

create policy "Authenticated users can manage daily_rates"
  on public.daily_rates for all to authenticated using (true);

-- Seed default rates matching employee categories
insert into public.daily_rates (category, role, rate, rate_type) values
  ('construction', 'Foreman', 450, 'hourly'),
  ('construction', 'Skilled', 380, 'hourly'),
  ('construction', 'Labor', 320, 'hourly'),
  ('admin', 'Operations', 65000, 'salary'),
  ('admin', 'Finance/Admin', 55000, 'salary')
on conflict (category, role) do nothing;
