-- Add new creator categories to the enum
ALTER TYPE public.creator_category ADD VALUE IF NOT EXISTS 'agency';
ALTER TYPE public.creator_category ADD VALUE IF NOT EXISTS 'graphic-designer';