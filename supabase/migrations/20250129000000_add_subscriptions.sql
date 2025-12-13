-- =============================================
-- SUBSCRIPTIONS TABLE (for Telegram bot subscriptions)
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    telegram_user_id BIGINT NOT NULL,
    telegram_username TEXT,
    telegram_first_name TEXT,
    telegram_last_name TEXT,
    subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'premium', 'premium_plus')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id),
    UNIQUE(telegram_user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_telegram_user_id ON public.subscriptions(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_type ON public.subscriptions(subscription_type);

-- RLS Policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own subscription
CREATE POLICY "Users can create their own subscription"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription
CREATE POLICY "Users can update their own subscription"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND is_admin = true
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- BOT_USERS TABLE (for tracking bot subscribers)
-- =============================================
CREATE TABLE IF NOT EXISTS public.bot_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_user_id BIGINT UNIQUE NOT NULL,
    telegram_username TEXT,
    telegram_first_name TEXT,
    telegram_last_name TEXT,
    telegram_photo_url TEXT,
    is_bot BOOLEAN DEFAULT false,
    language_code TEXT,
    is_premium BOOLEAN DEFAULT false,
    is_subscribed BOOLEAN DEFAULT true,
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bot_users_telegram_user_id ON public.bot_users(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_bot_users_subscribed ON public.bot_users(is_subscribed);
CREATE INDEX IF NOT EXISTS idx_bot_users_last_interaction ON public.bot_users(last_interaction_at);

-- RLS Policies
ALTER TABLE public.bot_users ENABLE ROW LEVEL SECURITY;

-- Everyone can view bot users (for public stats)
CREATE POLICY "Everyone can view bot users"
ON public.bot_users FOR SELECT
USING (true);

-- Only service role can insert/update bot users (via Edge Function)
-- This will be handled by service role in Edge Function

-- Trigger for updated_at
CREATE TRIGGER update_bot_users_updated_at
BEFORE UPDATE ON public.bot_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- REFERRALS TABLE (for tracking referrals from bot)
-- =============================================
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_telegram_id BIGINT NOT NULL,
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_telegram_id BIGINT,
    referral_code TEXT UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    reward_type TEXT CHECK (reward_type IN ('subscription_days', 'premium_access', 'discount')),
    reward_value INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_telegram_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user ON public.referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- RLS Policies
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals
CREATE POLICY "Users can view their own referrals"
ON public.referrals FOR SELECT
USING (
    referred_user_id = auth.uid() OR
    referrer_telegram_id IN (
        SELECT telegram_id::BIGINT FROM public.profiles
        WHERE user_id = auth.uid() AND telegram_id IS NOT NULL
    )
);

-- Admins can view all referrals
CREATE POLICY "Admins can view all referrals"
ON public.referrals FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND is_admin = true
    )
);

