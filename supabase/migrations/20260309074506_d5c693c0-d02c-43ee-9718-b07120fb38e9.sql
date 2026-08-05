
-- Create enums
CREATE TYPE public.creator_category AS ENUM ('photographer', 'influencer', 'videographer', 'model', 'content-creator', 'makeup-artist', 'stylist' , 'Agency');
CREATE TYPE public.profile_type AS ENUM ('creator', 'client');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE public.price_type AS ENUM ('fixed', 'hourly', 'package', 'negotiable');
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  type profile_type NOT NULL DEFAULT 'client',
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  phone TEXT,
  website TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, type)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 'client');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Creator profiles
CREATE TABLE public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  category creator_category NOT NULL DEFAULT 'photographer',
  specializations TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{English}',
  experience_years INTEGER DEFAULT 0,
  response_rate INTEGER DEFAULT 0,
  avg_response_time TEXT DEFAULT '1 hour',
  rank_score INTEGER DEFAULT 0,
  city_rank INTEGER DEFAULT 0,
  portfolio_quality_score INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  price_min INTEGER DEFAULT 0,
  price_max INTEGER DEFAULT 0,
  price_currency TEXT DEFAULT 'INR',
  instagram TEXT,
  youtube TEXT,
  twitter TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creator profiles viewable by everyone" ON public.creator_profiles FOR SELECT USING (true);
CREATE POLICY "Creators can update own profile" ON public.creator_profiles FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Creators can insert own profile" ON public.creator_profiles FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE TRIGGER update_creator_profiles_updated_at BEFORE UPDATE ON public.creator_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Services
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_type price_type NOT NULL DEFAULT 'fixed',
  price INTEGER NOT NULL DEFAULT 0,
  duration TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services viewable by everyone" ON public.services FOR SELECT USING (true);
CREATE POLICY "Creators can manage own services" ON public.services FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own services" ON public.services FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete own services" ON public.services FOR DELETE USING (auth.uid() = creator_id);

-- Portfolio items
CREATE TABLE public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Portfolio viewable by everyone" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "Creators can manage own portfolio" ON public.portfolio_items FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own portfolio" ON public.portfolio_items FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete own portfolio" ON public.portfolio_items FOR DELETE USING (auth.uid() = creator_id);

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  booking_date DATE NOT NULL,
  booking_time TIME,
  requirements TEXT,
  notes TEXT,
  total_price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = client_id OR auth.uid() = creator_id);
CREATE POLICY "Clients can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Participants can update bookings" ON public.bookings FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = creator_id);
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_avatar TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Clients can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = client_id);

-- Shortlists
CREATE TABLE public.shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, creator_id)
);
ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own shortlists" ON public.shortlists FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users can manage own shortlists" ON public.shortlists FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can delete own shortlists" ON public.shortlists FOR DELETE USING (auth.uid() = client_id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_creator_profiles_category ON public.creator_profiles(category);
CREATE INDEX idx_creator_profiles_rank ON public.creator_profiles(rank_score DESC);
CREATE INDEX idx_services_creator ON public.services(creator_id);
CREATE INDEX idx_portfolio_creator ON public.portfolio_items(creator_id);
CREATE INDEX idx_bookings_creator ON public.bookings(creator_id);
CREATE INDEX idx_bookings_client ON public.bookings(client_id);
CREATE INDEX idx_reviews_creator ON public.reviews(creator_id);
CREATE INDEX idx_profiles_city ON public.profiles(city);
