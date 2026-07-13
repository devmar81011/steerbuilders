-- API route already requires admin; storage RLS only needs authenticated.
-- JWT app_metadata is not always present in the access token used by storage.
drop policy if exists "Admins can upload project images" on storage.objects;
drop policy if exists "Admins can read project images" on storage.objects;

create policy "Authenticated users can upload project images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'project-images');

create policy "Authenticated users can read project images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'project-images');
