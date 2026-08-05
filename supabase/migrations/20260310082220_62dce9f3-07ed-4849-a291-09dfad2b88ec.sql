-- Create trigger for handle_new_user if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Update handle_new_user to also create creator_profile if type is creator
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'type', 'client')::profile_type
  );
  
  -- If creator, also create creator_profile
  IF COALESCE(NEW.raw_user_meta_data->>'type', 'client') = 'creator' THEN
    INSERT INTO public.creator_profiles (profile_id, category)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'category', 'photographer')::creator_category
    );
  END IF;
  
  RETURN NEW;
END;
$$;