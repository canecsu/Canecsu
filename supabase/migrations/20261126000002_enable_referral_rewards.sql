begin;

create unique index if not exists referrals_one_referred_user_idx
  on public.referrals (referred_id)
  where referred_id is not null;

create unique index if not exists referrals_code_lower_idx
  on public.referrals (lower(referral_code));

drop policy if exists "System can update referrals" on public.referrals;
drop policy if exists "Users can create referrals" on public.referrals;
drop policy if exists "Users can view own referrals" on public.referrals;

create policy "Users can create referrals"
  on public.referrals
  for insert
  to authenticated
  with check (
    (select auth.uid()) = referrer_id
    and upper(referral_code) = 'CANECSU-' || upper(substr((select auth.uid())::text, 1, 8))
  );

create policy "Users can view own referrals"
  on public.referrals
  for select
  to authenticated
  using (
    (select auth.uid()) = referrer_id
    or (select auth.uid()) = referred_id
  );

create or replace function public.complete_referral(p_referral_code text)
returns table (
  success boolean,
  result_status text,
  reward_days integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_referral public.referrals%rowtype;
  v_user_id uuid;
  v_subscription_id uuid;
  v_existing_expires_at timestamptz;
  v_reward_days integer;
begin
  if (auth.uid() is null) then
    raise exception 'Authentication required';
  end if;

  if p_referral_code is null or length(trim(p_referral_code)) = 0 then
    raise exception 'Referral code is required';
  end if;

  select *
    into v_referral
    from public.referrals
   where referral_code = upper(trim(p_referral_code))
   for update;

  if not found then
    raise exception 'Invalid referral code';
  end if;

  if v_referral.referrer_id = (select auth.uid()) then
    raise exception 'You cannot use your own referral code';
  end if;

  if v_referral.status = 'completed' then
    if v_referral.referred_id = (select auth.uid()) then
      return query select true, 'already_completed', greatest(coalesce(v_referral.reward_days, 30), 1);
      return;
    end if;
    raise exception 'This referral code has already been used';
  end if;

  if v_referral.referred_id is not null and v_referral.referred_id <> (select auth.uid()) then
    raise exception 'This referral code has already been used';
  end if;

  if exists (
    select 1
      from public.referrals r
     where r.referred_id = (select auth.uid())
  ) then
    raise exception 'This account has already used a referral code';
  end if;

  v_reward_days := greatest(coalesce(v_referral.reward_days, 30), 1);

  update public.referrals
     set referred_id = (select auth.uid()),
         status = 'completed'
   where id = v_referral.id;

  foreach v_user_id in array array[v_referral.referrer_id, (select auth.uid())]
  loop
    select s.id, s.expires_at
      into v_subscription_id, v_existing_expires_at
      from public.subscriptions s
     where s.user_id = v_user_id
       and s.status = 'active'
     order by s.expires_at desc nulls last
     limit 1
     for update;

    if found then
      update public.subscriptions
         set plan_name = 'pro',
             status = 'active',
             expires_at = greatest(coalesce(v_existing_expires_at, now()), now())
                          + make_interval(days => v_reward_days),
             payment_id = coalesce(payment_id, 'referral:' || v_referral.id::text)
       where id = v_subscription_id;
    else
      insert into public.subscriptions (
        user_id, plan_name, amount, payment_id, status, expires_at
      )
      values (
        v_user_id, 'pro', 0, 'referral:' || v_referral.id::text,
        'active', now() + make_interval(days => v_reward_days)
      );
    end if;
  end loop;

  return query select true, 'completed', v_reward_days;
exception
  when unique_violation then
    raise exception 'This account has already used a referral code';
end;
$$;

revoke execute on function public.complete_referral(text) from public, anon;
grant execute on function public.complete_referral(text) to authenticated;

commit;
