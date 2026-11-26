-- Harden portfolio media and project ownership policies.
--
-- Storage uploads are kept under the authenticated creator's user-id folder.
-- Project writes are limited to the authenticated creator that owns the row.

drop policy if exists "Authenticated can upload project media" on storage.objects;
drop policy if exists "Users can update own project media" on storage.objects;
drop policy if exists "Users can delete own project media" on storage.objects;

create policy "Authenticated creators can upload project media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project_media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Authenticated creators can update own project media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'project_media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'project_media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Authenticated creators can delete own project media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'project_media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Creators can insert own projects" on public.projects;
drop policy if exists "Creators can update own projects" on public.projects;
drop policy if exists "Creators can delete own projects" on public.projects;

create policy "Creators can insert own projects"
on public.projects
for insert
to authenticated
with check ((select auth.uid()) = creator_id);

create policy "Creators can update own projects"
on public.projects
for update
to authenticated
using ((select auth.uid()) = creator_id)
with check ((select auth.uid()) = creator_id);

create policy "Creators can delete own projects"
on public.projects
for delete
to authenticated
using ((select auth.uid()) = creator_id);
