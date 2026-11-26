
-- Payment operations, reconciliation, webhook history, audit logging and persisted admin settings.
create table if not exists public.payment_refunds (
  id uuid primary key default gen_random_uuid(),
  source_table text not null check (source_table in ('payments', 'subscriptions', 'creator_verification_subscriptions')),
  source_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  razorpay_payment_id text not null,
  razorpay_refund_id text not null unique,
  amount integer not null check (amount > 0),
  status text not null default 'processed',
  notes text,
  requested_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_payment_refunds_payment
  on public.payment_refunds(razorpay_payment_id, created_at desc);
create index if not exists idx_payment_refunds_user
  on public.payment_refunds(user_id, created_at desc);

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  razorpay_event_id text unique,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'received',
  error_message text,
  received_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz
);

create index if not exists idx_payment_webhook_events_received
  on public.payment_webhook_events(received_at desc);

create table if not exists public.admin_payment_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  razorpay_payment_id text,
  amount integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_admin_payment_audit_created
  on public.admin_payment_audit_logs(created_at desc);
create index if not exists idx_admin_payment_audit_payment
  on public.admin_payment_audit_logs(razorpay_payment_id, created_at desc);

alter table public.payments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.creator_verification_subscriptions enable row level security;
alter table public.escrow_payments enable row level security;

alter table public.payments
  add column if not exists refund_id text,
  add column if not exists refunded_amount integer not null default 0,
  add column if not exists refund_status text,
  add column if not exists settlement_id text,
  add column if not exists gateway_status text,
  add column if not exists gateway_fee_paise integer,
  add column if not exists gateway_tax_paise integer,
  add column if not exists gateway_data jsonb,
  add column if not exists last_reconciled_at timestamptz;

alter table public.subscriptions
  add column if not exists razorpay_order_id text,
  add column if not exists refund_id text,
  add column if not exists refunded_amount integer not null default 0,
  add column if not exists refund_status text,
  add column if not exists settlement_id text,
  add column if not exists gateway_status text,
  add column if not exists gateway_fee_paise integer,
  add column if not exists gateway_tax_paise integer,
  add column if not exists gateway_data jsonb,
  add column if not exists last_reconciled_at timestamptz;

alter table public.creator_verification_subscriptions
  add column if not exists refund_id text,
  add column if not exists refunded_amount integer not null default 0,
  add column if not exists refund_status text,
  add column if not exists settlement_id text,
  add column if not exists gateway_status text,
  add column if not exists gateway_fee_paise integer,
  add column if not exists gateway_tax_paise integer,
  add column if not exists gateway_data jsonb,
  add column if not exists last_reconciled_at timestamptz;

create index if not exists idx_payments_gateway_payment
  on public.payments(razorpay_payment_id);
create index if not exists idx_subscriptions_gateway_payment
  on public.subscriptions(payment_id);
create index if not exists idx_creator_badges_gateway_payment
  on public.creator_verification_subscriptions(razorpay_payment_id);

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.platform_settings(key, value)
values
  ('platformName', '"Canecsu"'::jsonb),
  ('supportEmail', '"support@canecsu.com"'::jsonb),
  ('maintenance', 'false'::jsonb),
  ('notifySignups', 'true'::jsonb),
  ('notifyVerification', 'true'::jsonb),
  ('notifyReports', 'true'::jsonb),
  ('notifyDisputes', 'true'::jsonb),
  ('requireEmailVerification', 'true'::jsonb),
  ('autoSuspend', 'false'::jsonb)
on conflict (key) do nothing;

alter table public.payment_refunds enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.admin_payment_audit_logs enable row level security;
alter table public.platform_settings enable row level security;

revoke all on public.payment_refunds from anon, authenticated;
revoke all on public.payment_webhook_events from anon, authenticated;
revoke all on public.admin_payment_audit_logs from anon, authenticated;
revoke all on public.platform_settings from anon, authenticated;

grant select on public.payment_refunds to authenticated;
grant select on public.payment_webhook_events to authenticated;
grant select on public.admin_payment_audit_logs to authenticated;
grant select, insert, update on public.platform_settings to authenticated;

drop policy if exists "Admins can view payment records" on public.payments;
create policy "Admins can view payment records"
  on public.payments for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role));

drop policy if exists "Admins can view subscriptions" on public.subscriptions;
create policy "Admins can view subscriptions"
  on public.subscriptions for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role));

drop policy if exists "Admins can view creator verification payments" on public.creator_verification_subscriptions;
create policy "Admins can view creator verification payments"
  on public.creator_verification_subscriptions for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role));

drop policy if exists "Admins can view payment refunds" on public.payment_refunds;
create policy "Admins can view payment refunds"
  on public.payment_refunds for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role));

drop policy if exists "Admins can view payment webhooks" on public.payment_webhook_events;
create policy "Admins can view payment webhooks"
  on public.payment_webhook_events for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role));

drop policy if exists "Admins can view payment audit logs" on public.admin_payment_audit_logs;
create policy "Admins can view payment audit logs"
  on public.admin_payment_audit_logs for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role));

drop policy if exists "Admins can view platform settings" on public.platform_settings;
create policy "Admins can view platform settings"
  on public.platform_settings for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role));

drop policy if exists "Admins can insert platform settings" on public.platform_settings;
create policy "Admins can insert platform settings"
  on public.platform_settings for insert to authenticated
  with check (public.has_role((select auth.uid()), 'admin'::public.app_role));

drop policy if exists "Admins can update platform settings" on public.platform_settings;
create policy "Admins can update platform settings"
  on public.platform_settings for update to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role))
  with check (public.has_role((select auth.uid()), 'admin'::public.app_role));
