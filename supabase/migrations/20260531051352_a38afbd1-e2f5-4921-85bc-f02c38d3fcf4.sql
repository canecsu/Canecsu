
-- Privacy / consent / minor protection columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS is_minor boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guardian_email text,
  ADD COLUMN IF NOT EXISTS marketing_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Breach notifications
CREATE TABLE IF NOT EXISTS public.breach_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  is_broadcast boolean NOT NULL DEFAULT true,
  affected_user_ids uuid[] NOT NULL DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.breach_notifications TO authenticated;
GRANT ALL ON public.breach_notifications TO service_role;

ALTER TABLE public.breach_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view relevant breach notifications"
ON public.breach_notifications
FOR SELECT
TO authenticated
USING (is_broadcast = true OR auth.uid() = ANY(affected_user_ids) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert breach notifications"
ON public.breach_notifications
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update breach notifications"
ON public.breach_notifications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete breach notifications"
ON public.breach_notifications
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
