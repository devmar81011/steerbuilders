-- Up to 4 image URLs per project (homepage gallery + portfolio)
alter table public.projects
  add column if not exists images text[] not null default '{}';

alter table public.projects
  drop constraint if exists projects_images_max_four;

alter table public.projects
  add constraint projects_images_max_four
  check (coalesce(array_length(images, 1), 0) <= 4);
