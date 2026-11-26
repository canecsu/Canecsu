create table if not exists private.bootstrap_admin_emails (
  email text primary key,
  created_at timestamptz not null default now(),
  constraint bootstrap_admin_emails_lowercase check (email = lower(trim(email)))
);

insert into private.bootstrap_admin_emails (email)
values
  ('canecsuindia@gmail.com'),
  ('sumirayandesign@gmail.com')
on conflict (email) do nothing;

alter table private.bootstrap_admin_emails enable row level security;
revoke all on table private.bootstrap_admin_emails from public, anon, authenticated;

create or replace function private.grant_bootstrap_admin_role()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $function$
begin
  if exists (
    select 1
    from private.bootstrap_admin_emails
    where email = lower(trim(new.email))
  ) then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin'::public.app_role)
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$function$;

revoke all on function private.grant_bootstrap_admin_role() from public, anon, authenticated;

drop trigger if exists on_auth_admin_user_created on auth.users;
create trigger on_auth_admin_user_created
  after insert on auth.users
  for each row
  execute function private.grant_bootstrap_admin_role();

insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users u
join private.bootstrap_admin_emails a
  on a.email = lower(trim(u.email))
on conflict (user_id, role) do nothing;
