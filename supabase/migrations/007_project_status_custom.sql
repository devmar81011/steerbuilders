-- Allow any custom project status label (e.g. "On hold", "Put on hold in 2025")
alter table public.projects drop constraint if exists projects_status_check;
