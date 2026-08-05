
-- 1. Extend services table with deliverables and add-ons for Gig/Package system
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS deliverables text[] DEFAULT '{}';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS add_ons jsonb DEFAULT '[]';

-- 2. Extend creator_profiles for Live Mode, Sponsored, and Subscription
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS is_available_now boolean DEFAULT false;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS available_until timestamp with time zone;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS is_sponsored boolean DEFAULT false;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS sponsored_until timestamp with time zone;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free';

-- 3. Collab Projects table
CREATE TABLE public.collab_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'general',
  budget_min integer DEFAULT 0,
  budget_max integer DEFAULT 0,
  location text,
  deadline date,
  skills_needed text[] DEFAULT '{}',
  status text DEFAULT 'open',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.collab_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open projects" ON public.collab_projects FOR SELECT USING (true);
CREATE POLICY "Creators can create projects" ON public.collab_projects FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own projects" ON public.collab_projects FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete own projects" ON public.collab_projects FOR DELETE USING (auth.uid() = creator_id);

-- 4. Collab Applications table
CREATE TABLE public.collab_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.collab_projects(id) ON DELETE CASCADE NOT NULL,
  applicant_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message text,
  proposed_price integer DEFAULT 0,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(project_id, applicant_id)
);
ALTER TABLE public.collab_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owners and applicants can view applications" ON public.collab_applications FOR SELECT USING (
  auth.uid() = applicant_id OR 
  auth.uid() IN (SELECT creator_id FROM public.collab_projects WHERE id = project_id)
);
CREATE POLICY "Creators can apply to projects" ON public.collab_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Project owners can update applications" ON public.collab_applications FOR UPDATE USING (
  auth.uid() IN (SELECT creator_id FROM public.collab_projects WHERE id = project_id)
);

-- 5. Referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code text UNIQUE NOT NULL,
  status text DEFAULT 'pending',
  reward_type text DEFAULT 'pro_access',
  reward_days integer DEFAULT 30,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);
CREATE POLICY "System can update referrals" ON public.referrals FOR UPDATE USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- 6. Escrow Payments table
CREATE TABLE public.escrow_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  platform_fee integer DEFAULT 0,
  status text DEFAULT 'held',
  released_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.escrow_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view escrow" ON public.escrow_payments FOR SELECT USING (auth.uid() = client_id OR auth.uid() = creator_id);
CREATE POLICY "Clients can create escrow" ON public.escrow_payments FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Admins can update escrow" ON public.escrow_payments FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
