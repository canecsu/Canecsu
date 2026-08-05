# Privacy & Compliance Update Plan

## 1. Consent & Notice (Register flow)
- Add required **consent checkbox** to `src/pages/Register.tsx` (and creator register) before submit is enabled:
  - "I agree to the Privacy Policy and Terms of Service"
  - "I confirm I am 18 or older, or have parental/guardian consent"
- Add a short, plain-language data-collection notice block above the form (what is collected: name, email, phone, profile content; why: account, bookings, communication).
- Block submission until both boxes are ticked. Store `consent_at` timestamp on profile.

## 2. Age Gate / Minor Protection
- Add **date-of-birth field** (or "I am 18+" affirmation) to Register.
- If under 18: show parental-consent notice + require guardian email; restrict any tracking/marketing.
- Add `dob`, `is_minor`, `guardian_email`, `marketing_opt_in` columns to `profiles`.
- Default `marketing_opt_in = false` for minors and enforce in any future tracking calls.

## 3. Right to Erasure
- New section in `src/pages/Profile.tsx` (Account Settings) → **"Delete My Account & Data"** with confirm dialog.
- New edge function `delete-account` (verify JWT) that:
  - Deletes/anonymizes rows in `profiles`, `creator_profiles`, `portfolio_items`, `services`, `messages` (anonymize sender/receiver to NULL or "deleted user"), `reviews` (anonymize client_name), `bookings` (keep for legal/finance but null personal fields), `notifications`, `shortlists`, `verification_requests`, `referrals`, storage objects under user's folder.
  - Calls `auth.admin.deleteUser` via service role.
- Mirror entry on `src/pages/Privacy.tsx` linking to settings.

## 4. Data Security & Breach Handling
- New `breach_notifications` table (admin posts → users see). Migration:
  - columns: title, message, severity, affected_user_ids[] (or broadcast flag), created_at.
  - RLS: users see ones targeting them; admins write.
- New `BreachBanner` component shown site-wide when unread notifications exist.
- Add admin page `src/pages/admin/AdminBreachNotifications.tsx` for posting.
- Document encryption: note in Privacy page that transport is HTTPS and storage uses Supabase encryption at rest.

## 5. DPO / Privacy Contact
- Add `privacy@canecsu.com` (DPO) email to **Footer Support column** and Privacy page.
- New **Grievance / Privacy Complaint form** section on `src/pages/Privacy.tsx` that writes to existing `contact_messages` with subject prefix `[Privacy]`.

## 6. Footer Links
- Confirm Privacy Policy, Terms of Service, Contact links are present and visible in `Footer.tsx` Support column (already are). Add "Delete My Account" link for logged-in users.

## 7. Remove Client-Side Pricing Gates
- Audit & strip any remaining `userPlan`/`subscription_tier`/tier-based conditional rendering in:
  - `src/pages/CreatorProfile.tsx`
  - `src/pages/CollabHub.tsx`
  - `src/pages/CreatorDashboard.tsx`
  - `src/pages/ClientDashboard.tsx`
  - `src/components/booking/BookingDialog.tsx`
  - any other component referencing `subscription_tier`, `pro`, `premium`, `business`, `userPlan`, `/pricing` redirect.
- Replace with either: always allow, or call an edge function that checks server-side and returns 403.
- Leave Razorpay payment server verification intact.

## Database Migration (single file)
```sql
ALTER TABLE public.profiles
  ADD COLUMN consent_at timestamptz,
  ADD COLUMN dob date,
  ADD COLUMN is_minor boolean NOT NULL DEFAULT false,
  ADD COLUMN guardian_email text,
  ADD COLUMN marketing_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN deleted_at timestamptz;

CREATE TABLE public.breach_notifications (...);
GRANT SELECT ON public.breach_notifications TO authenticated;
GRANT ALL ON public.breach_notifications TO service_role;
ALTER TABLE public.breach_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view broadcasts or targeted" ...;
CREATE POLICY "Admins manage" ...;
```

## Edge Function
- `supabase/functions/delete-account/index.ts` — service-role wipe + auth user deletion.

## Files to Touch
- New: migration, `delete-account/index.ts`, `BreachBanner.tsx`, `AdminBreachNotifications.tsx`, `PrivacyContactForm.tsx`
- Edit: `Register.tsx`, `Registercreator.tsx`, `Profile.tsx`, `Privacy.tsx`, `Footer.tsx`, `App.tsx` (banner + admin route), `CreatorProfile.tsx`, `CollabHub.tsx`, `CreatorDashboard.tsx`, `ClientDashboard.tsx`, `BookingDialog.tsx`

## Out of Scope
- Real DSAR export pipeline (manual via privacy email).
- Third-party analytics/cookie banner (none currently installed).

## Acceptance
- Cannot register without ticking consent + age affirmation.
- Minors see parental consent notice and marketing is off.
- "Delete My Account" wipes data + signs out.
- Privacy page lists DPO email and has working complaint form.
- No client-side `if (plan === ...)` gates remain.
- Breach banner appears for affected users when admin posts.
