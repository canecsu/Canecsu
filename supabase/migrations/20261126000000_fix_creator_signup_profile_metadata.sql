-- Keep creator signup categories and profile metadata in sync with the app.
ALTER TYPE public.creator_category ADD VALUE IF NOT EXISTS 'video-editor';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  metadata jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    type,
    phone,
    dob,
    is_minor,
    guardian_email,
    marketing_opt_in,
    consent_at
  )
  VALUES (
    NEW.id,
    COALESCE(NULLIF(metadata->>'name', ''), NEW.email),
    COALESCE(NULLIF(metadata->>'type', ''), 'client')::profile_type,
    NULLIF(metadata->>'phone', ''),
    CASE
      WHEN NULLIF(metadata->>'dob', '') IS NULL THEN NULL
      ELSE (metadata->>'dob')::date
    END,
    COALESCE(NULLIF(metadata->>'is_minor', '')::boolean, false),
    NULLIF(metadata->>'guardian_email', ''),
    COALESCE(NULLIF(metadata->>'marketing_opt_in', '')::boolean, false),
    CASE
      WHEN NULLIF(metadata->>'consent_at', '') IS NULL THEN NULL
      ELSE (metadata->>'consent_at')::timestamptz
    END
  );

  IF COALESCE(NULLIF(metadata->>'type', ''), 'client') = 'creator' THEN
    INSERT INTO public.creator_profiles (profile_id, category)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(metadata->>'category', ''), 'photographer')::creator_category
    );
  END IF;

  RETURN NEW;
END;
$function$;
