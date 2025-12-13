-- =============================================
-- Add Telegram fields to profiles table
-- =============================================

-- Add Telegram-related columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS telegram_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS telegram_username TEXT,
ADD COLUMN IF NOT EXISTS telegram_first_name TEXT,
ADD COLUMN IF NOT EXISTS telegram_last_name TEXT,
ADD COLUMN IF NOT EXISTS telegram_photo_url TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON public.profiles(telegram_id);

-- Add comment
COMMENT ON COLUMN public.profiles.telegram_id IS 'Telegram user ID for Mini App authentication';
COMMENT ON COLUMN public.profiles.telegram_username IS 'Telegram username (@username)';
COMMENT ON COLUMN public.profiles.telegram_first_name IS 'Telegram first name';
COMMENT ON COLUMN public.profiles.telegram_last_name IS 'Telegram last name';
COMMENT ON COLUMN public.profiles.telegram_photo_url IS 'Telegram profile photo URL';

