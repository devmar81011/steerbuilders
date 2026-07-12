-- Employee categories: construction | admin
-- Construction roles: Foreman, Skilled, Labor
-- Admin roles: Operations, Finance/Admin

alter table public.employees
  add column if not exists category text not null default 'construction'
  check (category in ('construction', 'admin'));

-- role column already exists; ensure it can store the defined role values
