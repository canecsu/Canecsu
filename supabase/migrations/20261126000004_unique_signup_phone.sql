-- Email addresses are unique in Supabase Auth.
-- Store registration phone numbers in normalized form in the frontend and
-- enforce one non-empty phone number per profile at the database level.
create unique index if not exists profiles_phone_unique_idx
  on public.profiles (phone)
  where phone is not null and length(trim(phone)) > 0;
