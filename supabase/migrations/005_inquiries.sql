-- Public inquiry submissions from contact form
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);

alter table public.inquiries enable row level security;

create policy "Anyone can submit an inquiry"
  on public.inquiries for insert to anon, authenticated
  with check (true);

create policy "Authenticated users can read inquiries"
  on public.inquiries for select to authenticated
  using (true);
