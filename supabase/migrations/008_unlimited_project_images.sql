-- Allow unlimited project photos (homepage still previews first 4)
alter table public.projects drop constraint if exists projects_images_max_four;
