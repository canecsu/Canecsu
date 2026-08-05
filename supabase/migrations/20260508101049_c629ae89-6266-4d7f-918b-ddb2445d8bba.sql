-- 1. Extend booking_status enum with new lifecycle values
DO $$ BEGIN
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'requested';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'approved';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'rejected';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'advance_pending';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'advance_paid';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'work_in_progress';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'work_completed';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'final_pending';
END $$;

-- 2. Extend bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS advance_amount integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_amount integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_fee integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS advance_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS work_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS final_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS advance_payment_id text,
  ADD COLUMN IF NOT EXISTS final_payment_id text;

-- 3. Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  client_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  stage text NOT NULL CHECK (stage IN ('advance','final')),
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'success',
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view payments" ON public.payments
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = creator_id);

CREATE POLICY "Clients insert payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_creator_status ON public.bookings(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_client_status ON public.bookings(client_id, status);