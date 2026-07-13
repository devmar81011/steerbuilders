-- Public bucket for project gallery photos (admin upload, public read)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images',
  'project-images',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins can upload project images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-images'
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "Admins can read project images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'project-images'
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "Public can view project images"
  on storage.objects for select
  to public
  using (bucket_id = 'project-images');
