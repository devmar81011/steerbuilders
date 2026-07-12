create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "Anyone can read site settings"
  on public.site_settings for select to anon, authenticated using (true);

create policy "Authenticated users can manage site settings"
  on public.site_settings for all to authenticated using (true);

insert into public.site_settings (key, value)
values ('featured_project_limit', '4'::jsonb)
on conflict (key) do nothing;
