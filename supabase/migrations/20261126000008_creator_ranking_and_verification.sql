-- Creator ranking scores and paid monthly verification badge
create table if not exists public.creator_verification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_name text not null default 'creator_verification',
  amount integer not null default 99 check (amount = 99),
  razorpay_order_id text not null unique,
  razorpay_payment_id text not null unique,
  status text not null default 'active' check (status in ('active','expired','cancelled')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_creator_verification_subscriptions_user
  on public.creator_verification_subscriptions(user_id, expires_at desc);
create index if not exists idx_creator_verification_subscriptions_active
  on public.creator_verification_subscriptions(status, expires_at);

alter table public.creator_verification_subscriptions enable row level security;
grant select on public.creator_verification_subscriptions to authenticated;
drop policy if exists "Creators can view own paid verification" on public.creator_verification_subscriptions;
create policy "Creators can view own paid verification"
  on public.creator_verification_subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.creator_ranking_scores (
  creator_id uuid primary key references public.profiles(id) on delete cascade,
  portfolio_score integer not null default 0 check (portfolio_score between 0 and 25),
  rating_score integer not null default 0 check (rating_score between 0 and 25),
  response_score integer not null default 0 check (response_score between 0 and 15),
  activity_score integer not null default 0 check (activity_score between 0 and 15),
  verification_score integer not null default 0 check (verification_score between 0 and 10),
  booking_score integer not null default 0 check (booking_score between 0 and 10),
  total_score integer not null default 0 check (total_score between 0 and 100),
  avg_rating numeric(4,2) not null default 0,
  review_count integer not null default 0,
  total_bookings integer not null default 0,
  completed_bookings integer not null default 0,
  portfolio_items_count integer not null default 0,
  published_projects_count integer not null default 0,
  is_paid_badge boolean not null default false,
  badge_expires_at timestamptz,
  calculated_at timestamptz not null default now()
);

alter table public.creator_ranking_scores enable row level security;
grant select on public.creator_ranking_scores to anon, authenticated;
drop policy if exists "Anyone can view creator ranking scores" on public.creator_ranking_scores;
create policy "Anyone can view creator ranking scores"
  on public.creator_ranking_scores for select to public using (true);

create or replace function private.refresh_creator_ranking(p_creator_id uuid)
returns void language plpgsql security definer
set search_path = public, private
as $$
declare
  v_is_verified boolean := false;
  v_response_rate integer := 0;
  v_is_live boolean := false;
  v_available_until timestamptz;
  v_has_badge boolean := false;
  v_badge_expires_at timestamptz;
  v_avg_rating numeric := 0;
  v_review_count integer := 0;
  v_total_bookings integer := 0;
  v_completed_bookings integer := 0;
  v_portfolio_items integer := 0;
  v_recent_portfolio_items integer := 0;
  v_published_projects integer := 0;
  v_recent_projects integer := 0;
  v_active_services integer := 0;
  v_portfolio_score integer := 0;
  v_rating_score integer := 0;
  v_response_score integer := 0;
  v_activity_score integer := 0;
  v_verification_score integer := 0;
  v_booking_score integer := 0;
  v_total_score integer := 0;
begin
  if not exists (select 1 from public.profiles where id = p_creator_id and type::text = 'creator') then
    return;
  end if;

  select coalesce(p.is_verified, false), coalesce(cp.response_rate, 0),
    coalesce(cp.is_available_now, false), cp.available_until
  into v_is_verified, v_response_rate, v_is_live, v_available_until
  from public.profiles p
  left join public.creator_profiles cp on cp.profile_id = p.id
  where p.id = p_creator_id;

  select exists (
    select 1 from public.creator_verification_subscriptions cvs
    where cvs.user_id = p_creator_id and cvs.status = 'active' and cvs.expires_at > now()
  ), max(cvs.expires_at)
  into v_has_badge, v_badge_expires_at
  from public.creator_verification_subscriptions cvs
  where cvs.user_id = p_creator_id and cvs.status = 'active' and cvs.expires_at > now();

  select count(*)::integer, coalesce(avg(r.rating), 0)::numeric
  into v_review_count, v_avg_rating
  from public.reviews r
  where r.creator_id = p_creator_id and r.booking_id is not null
    and exists (
      select 1 from public.bookings b
      where b.id = r.booking_id and b.creator_id = p_creator_id
        and b.client_id = r.client_id and b.status = 'completed'
    );

  select count(*) filter (where b.status::text <> 'cancelled')::integer,
    count(*) filter (where b.status::text = 'completed')::integer
  into v_total_bookings, v_completed_bookings
  from public.bookings b where b.creator_id = p_creator_id;

  select count(*)::integer,
    count(*) filter (where pi.created_at >= now() - interval '90 days')::integer
  into v_portfolio_items, v_recent_portfolio_items
  from public.portfolio_items pi where pi.creator_id = p_creator_id;

  select count(*) filter (where pr.published = true)::integer,
    count(*) filter (where pr.published = true and pr.updated_at >= now() - interval '90 days')::integer
  into v_published_projects, v_recent_projects
  from public.projects pr where pr.creator_id = p_creator_id;

  select count(*) filter (where s.is_active = true)::integer
  into v_active_services
  from public.services s where s.creator_id = p_creator_id;

  v_portfolio_score := least(25,
    least(v_published_projects, 5) * 3 + least(v_portfolio_items, 10)
    + least(v_active_services, 2) * 2
    + case when exists (select 1 from public.profiles p where p.id = p_creator_id and nullif(trim(p.bio), '') is not null) then 2 else 0 end
    + case when exists (select 1 from public.profiles p where p.id = p_creator_id and p.avatar_url is not null) then 2 else 0 end
    + case when exists (select 1 from public.profiles p where p.id = p_creator_id and p.city is not null and p.state is not null) then 2 else 0 end
  );

  v_rating_score := case when v_review_count = 0 then 0 else round(
    (least(5, greatest(0, v_avg_rating)) / 5.0) * 25.0
    * least(1.0, v_review_count::numeric / 10.0)
  )::integer end;

  v_response_score := round(least(100, greatest(0, v_response_rate))::numeric * 15.0 / 100.0)::integer;
  v_activity_score := least(15,
    least(v_recent_projects, 4) * 2 + least(v_recent_portfolio_items, 5)
    + case when v_is_live and v_available_until > now() then 2 else 0 end
  );
  v_verification_score := case when v_is_verified then 5 else 0 end + case when v_has_badge then 5 else 0 end;
  v_booking_score := least(10, v_completed_bookings * 2);
  v_total_score := least(100, v_portfolio_score + v_rating_score + v_response_score
    + v_activity_score + v_verification_score + v_booking_score);

  insert into public.creator_ranking_scores (
    creator_id, portfolio_score, rating_score, response_score, activity_score,
    verification_score, booking_score, total_score, avg_rating, review_count,
    total_bookings, completed_bookings, portfolio_items_count, published_projects_count,
    is_paid_badge, badge_expires_at, calculated_at
  ) values (
    p_creator_id, v_portfolio_score, v_rating_score, v_response_score, v_activity_score,
    v_verification_score, v_booking_score, v_total_score, round(v_avg_rating, 2), v_review_count,
    v_total_bookings, v_completed_bookings, v_portfolio_items, v_published_projects,
    v_has_badge, v_badge_expires_at, now()
  )
  on conflict (creator_id) do update set
    portfolio_score = excluded.portfolio_score, rating_score = excluded.rating_score,
    response_score = excluded.response_score, activity_score = excluded.activity_score,
    verification_score = excluded.verification_score, booking_score = excluded.booking_score,
    total_score = excluded.total_score, avg_rating = excluded.avg_rating,
    review_count = excluded.review_count, total_bookings = excluded.total_bookings,
    completed_bookings = excluded.completed_bookings, portfolio_items_count = excluded.portfolio_items_count,
    published_projects_count = excluded.published_projects_count, is_paid_badge = excluded.is_paid_badge,
    badge_expires_at = excluded.badge_expires_at, calculated_at = excluded.calculated_at;

  update public.creator_profiles set rank_score = v_total_score where profile_id = p_creator_id;
end;
$$;

create or replace function private.refresh_creator_ranking_trigger()
returns trigger language plpgsql security definer
set search_path = public, private
as $$
declare v_creator_id uuid;
begin
  if pg_trigger_depth() > 1 then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  if tg_op = 'DELETE' then
    if tg_table_name = 'profiles' then v_creator_id := old.id;
    elsif tg_table_name = 'creator_profiles' then v_creator_id := old.profile_id;
    elsif tg_table_name in ('reviews','bookings','portfolio_items','projects','services') then v_creator_id := old.creator_id;
    elsif tg_table_name = 'creator_verification_subscriptions' then v_creator_id := old.user_id;
    end if;
  else
    if tg_table_name = 'profiles' then v_creator_id := new.id;
    elsif tg_table_name = 'creator_profiles' then v_creator_id := new.profile_id;
    elsif tg_table_name in ('reviews','bookings','portfolio_items','projects','services') then v_creator_id := new.creator_id;
    elsif tg_table_name = 'creator_verification_subscriptions' then v_creator_id := new.user_id;
    end if;
  end if;
  if v_creator_id is not null then perform private.refresh_creator_ranking(v_creator_id); end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

revoke all on function private.refresh_creator_ranking(uuid) from public, anon, authenticated;
revoke all on function private.refresh_creator_ranking_trigger() from public, anon, authenticated;

drop trigger if exists refresh_ranking_after_profiles on public.profiles;
create trigger refresh_ranking_after_profiles after insert or update or delete on public.profiles
for each row execute function private.refresh_creator_ranking_trigger();
drop trigger if exists refresh_ranking_after_creator_profiles on public.creator_profiles;
create trigger refresh_ranking_after_creator_profiles after insert or update or delete on public.creator_profiles
for each row execute function private.refresh_creator_ranking_trigger();
drop trigger if exists refresh_ranking_after_reviews on public.reviews;
create trigger refresh_ranking_after_reviews after insert or update or delete on public.reviews
for each row execute function private.refresh_creator_ranking_trigger();
drop trigger if exists refresh_ranking_after_bookings on public.bookings;
create trigger refresh_ranking_after_bookings after insert or update or delete on public.bookings
for each row execute function private.refresh_creator_ranking_trigger();
drop trigger if exists refresh_ranking_after_portfolio_items on public.portfolio_items;
create trigger refresh_ranking_after_portfolio_items after insert or update or delete on public.portfolio_items
for each row execute function private.refresh_creator_ranking_trigger();
drop trigger if exists refresh_ranking_after_projects on public.projects;
create trigger refresh_ranking_after_projects after insert or update or delete on public.projects
for each row execute function private.refresh_creator_ranking_trigger();
drop trigger if exists refresh_ranking_after_services on public.services;
create trigger refresh_ranking_after_services after insert or update or delete on public.services
for each row execute function private.refresh_creator_ranking_trigger();
drop trigger if exists refresh_ranking_after_creator_badge on public.creator_verification_subscriptions;
create trigger refresh_ranking_after_creator_badge after insert or update or delete on public.creator_verification_subscriptions
for each row execute function private.refresh_creator_ranking_trigger();

do $$
declare creator_record record;
begin
  for creator_record in select id from public.profiles where type::text = 'creator' loop
    perform private.refresh_creator_ranking(creator_record.id);
  end loop;
end;
$$;
