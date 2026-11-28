-- Keep the denormalized comment like count in sync with comment_likes.
create index if not exists idx_comment_likes_comment_id
  on public.comment_likes(comment_id);

create or replace function public.sync_project_comment_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comment_id uuid;
begin
  v_comment_id := case when tg_op = 'DELETE' then old.comment_id else new.comment_id end;

  update public.project_comments
  set likes_count = (
    select count(*)::integer
    from public.comment_likes
    where comment_id = v_comment_id
  )
  where id = v_comment_id;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.sync_project_comment_likes_count() from public, anon, authenticated;

drop trigger if exists sync_project_comment_likes_count on public.comment_likes;
create trigger sync_project_comment_likes_count
after insert or delete on public.comment_likes
for each row execute function public.sync_project_comment_likes_count();

update public.project_comments pc
set likes_count = (
  select count(*)::integer
  from public.comment_likes cl
  where cl.comment_id = pc.id
);

