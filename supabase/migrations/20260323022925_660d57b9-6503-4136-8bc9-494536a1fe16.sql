
-- Add new booking status values
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'in_progress';

-- Create availability_slots table for creator schedule management
CREATE TABLE public.availability_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  booking_id UUID REFERENCES public.bookings(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(creator_id, slot_date, start_time)
);

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view availability" ON public.availability_slots FOR SELECT TO public USING (true);
CREATE POLICY "Creators can manage own slots" ON public.availability_slots FOR INSERT TO public WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own slots" ON public.availability_slots FOR UPDATE TO public USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete own slots" ON public.availability_slots FOR DELETE TO public USING (auth.uid() = creator_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT TO public WITH CHECK (true);

-- Add booking_time column type change and location
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS location TEXT;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
