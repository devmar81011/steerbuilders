-- Sites table for managing project sites
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure site names are unique
create unique index if not exists sites_name_unique on public.sites (name);

-- Row Level Security
alter table public.sites enable row level security;

create policy "Authenticated users can read sites"
  on public.sites for select to authenticated using (true);

create policy "Authenticated users can manage sites"
  on public.sites for all to authenticated using (true);
