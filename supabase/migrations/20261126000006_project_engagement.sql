-- Project engagement tracking and comment editing
alter table public.project_comments
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_project_comments_project_id
  on public.project_comments(project_id);

create index if not exists idx_project_likes_project_id
  on public.project_likes(project_id);

create table if not exists public.project_shares (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_shares_project_id
  on public.project_shares(project_id);

alter table public.project_shares enable row level security;

grant select, insert on table public.project_shares to anon, authenticated;

drop policy if exists "Anyone can view project shares" on public.project_shares;
create policy "Anyone can view project shares"
  on public.project_shares
  for select
  to public
  using (true);

drop policy if exists "Anyone can record project shares" on public.project_shares;
create policy "Anyone can record project shares"
  on public.project_shares
  for insert
  to public
  with check (
    (user_id is null or (select auth.uid()) = user_id)
    and exists (
      select 1
      from public.projects p
      where p.id = project_shares.project_id
        and p.published = true
    )
  );

drop policy if exists "Users can update own comments" on public.project_comments;
create policy "Users can update own comments"
  on public.project_comments
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
