
-- New category enum values
ALTER TYPE public.creator_category ADD VALUE IF NOT EXISTS 'singer';
ALTER TYPE public.creator_category ADD VALUE IF NOT EXISTS 'dj';
ALTER TYPE public.creator_category ADD VALUE IF NOT EXISTS 'music-band';

-- Subcategory + suspension
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS subcategory text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

-- Verification requests
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  gov_id_url text,
  selfie_url text,
  business_proof_url text,
  portfolio_notes text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own verification requests"
ON public.verification_requests FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users create own verification requests"
ON public.verification_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own pending requests"
ON public.verification_requests FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins update verification requests"
ON public.verification_requests FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_verification_requests_updated_at
BEFORE UPDATE ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Profile violations
CREATE TABLE IF NOT EXISTS public.profile_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  violation_type text NOT NULL,
  context text,
  detected_content text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profile_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own violations"
ON public.profile_violations FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated insert violations"
ON public.profile_violations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Private verification-docs bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own verification docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own verification docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-docs'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Users delete own verification docs"
ON storage.objects FOR DELETE
USING (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
