-- Allow authenticated admins to clear inquiries from superadmin reset tools.
create policy "Authenticated users can manage inquiries"
on public.inquiries
for all
to authenticated
using (true)
with check (true);
