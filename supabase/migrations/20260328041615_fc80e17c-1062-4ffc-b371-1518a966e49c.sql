
-- Create projects table for rich Behance-style projects
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_blocks jsonb DEFAULT '[]'::jsonb,
  cover_image_url text,
  published boolean DEFAULT false,
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published projects" ON public.projects FOR SELECT USING (published = true OR auth.uid() = creator_id);
CREATE POLICY "Creators can insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = creator_id);

-- Create subscriptions table for plan tracking
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  payment_id text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow comments and likes on projects (not just portfolio items)
ALTER TABLE public.project_comments ALTER COLUMN portfolio_item_id DROP NOT NULL;
ALTER TABLE public.project_comments ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_likes ALTER COLUMN portfolio_item_id DROP NOT NULL;
ALTER TABLE public.project_likes ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

-- Storage bucket for project media
INSERT INTO storage.buckets (id, name, public) VALUES ('project_media', 'project_media', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can view project media" ON storage.objects FOR SELECT USING (bucket_id = 'project_media');
CREATE POLICY "Authenticated can upload project media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project_media' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own project media" ON storage.objects FOR DELETE USING (bucket_id = 'project_media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for projects
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
