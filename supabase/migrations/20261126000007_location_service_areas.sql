-- Service areas, consented live locations, and rate-limited live searches
create schema if not exists private;
revoke all on schema private from public;

create or replace function private.distance_km(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
returns double precision
language sql
immutable
strict
set search_path = public
as $$
  select 6371.0 * 2.0 * asin(
    sqrt(
      least(
        1.0,
        power(sin(radians(lat2 - lat1) / 2.0), 2)
        + cos(radians(lat1)) * cos(radians(lat2))
        * power(sin(radians(lon2 - lon1) / 2.0), 2)
      )
    )
  );
$$;

create table if not exists public.creator_service_areas (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  area_type text not null default 'radius' check (area_type in ('city', 'radius')),
  city text,
  state text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  radius_km double precision not null default 25 check (radius_km > 0 and radius_km <= 500),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_creator_service_areas_creator on public.creator_service_areas(creator_id);
create index if not exists idx_creator_service_areas_location on public.creator_service_areas(latitude, longitude);

create table if not exists public.creator_live_locations (
  creator_id uuid primary key references public.profiles(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy_m double precision,
  is_active boolean not null default true,
  consented_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_creator_live_locations_active on public.creator_live_locations(is_active, expires_at);

create table if not exists public.live_search_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  location_label text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  radius_km double precision not null default 25 check (radius_km > 0 and radius_km <= 100),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 minutes')
);

create index if not exists idx_live_search_requests_client_created on public.live_search_requests(client_id, created_at desc);
create index if not exists idx_live_search_requests_location on public.live_search_requests(latitude, longitude);

alter table public.creator_service_areas enable row level security;
alter table public.creator_live_locations enable row level security;
alter table public.live_search_requests enable row level security;

grant select on table public.creator_service_areas, public.creator_live_locations to anon, authenticated;
grant insert, update, delete on table public.creator_service_areas, public.creator_live_locations to authenticated;
grant insert on table public.live_search_requests to authenticated;

drop policy if exists "Anyone can view active service areas" on public.creator_service_areas;
create policy "Anyone can view active service areas" on public.creator_service_areas for select to public using (is_active = true);

drop policy if exists "Creators can add own service areas" on public.creator_service_areas;
create policy "Creators can add own service areas" on public.creator_service_areas for insert to authenticated with check ((select auth.uid()) = creator_id);

drop policy if exists "Creators can update own service areas" on public.creator_service_areas;
create policy "Creators can update own service areas" on public.creator_service_areas for update to authenticated using ((select auth.uid()) = creator_id) with check ((select auth.uid()) = creator_id);

drop policy if exists "Creators can delete own service areas" on public.creator_service_areas;
create policy "Creators can delete own service areas" on public.creator_service_areas for delete to authenticated using ((select auth.uid()) = creator_id);

drop policy if exists "Anyone can view active live locations" on public.creator_live_locations;
create policy "Anyone can view active live locations" on public.creator_live_locations for select to public using (is_active = true and expires_at > now());

drop policy if exists "Creators can start own live location" on public.creator_live_locations;
create policy "Creators can start own live location" on public.creator_live_locations for insert to authenticated with check ((select auth.uid()) = creator_id);

drop policy if exists "Creators can update own live location" on public.creator_live_locations;
create policy "Creators can update own live location" on public.creator_live_locations for update to authenticated using ((select auth.uid()) = creator_id) with check ((select auth.uid()) = creator_id);

drop policy if exists "Creators can stop own live location" on public.creator_live_locations;
create policy "Creators can stop own live location" on public.creator_live_locations for delete to authenticated using ((select auth.uid()) = creator_id);

drop policy if exists "Clients can create live searches" on public.live_search_requests;
create policy "Clients can create live searches" on public.live_search_requests for insert to authenticated with check (
  (select auth.uid()) = client_id
  and not exists (
    select 1 from public.live_search_requests recent
    where recent.client_id = (select auth.uid())
      and recent.created_at > now() - interval '10 minutes'
  )
);

create or replace function private.notify_creators_for_live_search()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  insert into public.notifications(user_id, title, message, type, link)
  select distinct
    cp.profile_id,
    'Client is looking for ' || initcap(replace(new.category, '-', ' ')),
    'A client is looking for a ' || initcap(replace(new.category, '-', ' '))
      || ' near ' || new.location_label || '. You match this live search.',
    'live_search',
    '/map?live_search=' || new.id::text
  from public.creator_profiles cp
  join public.creator_live_locations ll on ll.creator_id = cp.profile_id
  where cp.category::text = new.category
    and cp.is_available_now = true
    and ll.is_active = true
    and ll.expires_at > now()
    and private.distance_km(new.latitude, new.longitude, ll.latitude, ll.longitude) <= new.radius_km
    and exists (
      select 1 from public.creator_service_areas sa
      where sa.creator_id = cp.profile_id
        and sa.is_active = true
        and private.distance_km(new.latitude, new.longitude, sa.latitude, sa.longitude) <= sa.radius_km + new.radius_km
    )
    and cp.profile_id <> new.client_id
    and not exists (
      select 1 from public.notifications recent
      where recent.user_id = cp.profile_id
        and recent.type = 'live_search'
        and recent.created_at > now() - interval '10 minutes'
    );
  return new;
end;
$$;

revoke all on function private.notify_creators_for_live_search() from public, anon, authenticated;

drop trigger if exists notify_live_search_creators on public.live_search_requests;
create trigger notify_live_search_creators after insert on public.live_search_requests for each row execute function private.notify_creators_for_live_search();
