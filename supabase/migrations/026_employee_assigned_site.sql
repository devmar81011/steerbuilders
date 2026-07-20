-- Add assigned_site field to employees
-- This can be blank when adding an employee, will be assigned later
alter table public.employees
  add column if not exists assigned_site text;

-- Change role column name to designation for consistency
alter table public.employees
  rename column role to designation;
