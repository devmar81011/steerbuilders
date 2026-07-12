-- Projects table (portfolio from company profile)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scope text not null,
  location text not null,
  status text not null check (status in ('Completed', 'Ongoing', 'Put on hold in 2025')),
  completion text not null,
  description text,
  featured boolean not null default false,
  category text check (category is null or category in ('completed', 'ongoing')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_featured_idx on public.projects (featured);

alter table public.projects enable row level security;

-- Public read for portfolio display
create policy "Anyone can read projects"
  on public.projects for select to anon, authenticated using (true);

create policy "Authenticated users can manage projects"
  on public.projects for all to authenticated using (true);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
