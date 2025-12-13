-- =============================================
-- SUPPORT TICKETS TABLE (for user support requests)
-- =============================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    telegram_user_id BIGINT,
    telegram_username TEXT,
    ticket_number TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'technical', 'payment', 'booking', 'other')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID REFERENCES auth.users(id),
    admin_response TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_telegram_user_id ON public.support_tickets(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number ON public.support_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at);

-- RLS Policies
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets"
ON public.support_tickets FOR SELECT
USING (
    auth.uid() = user_id OR
    telegram_user_id IN (
        SELECT telegram_id::BIGINT FROM public.profiles
        WHERE user_id = auth.uid() AND telegram_id IS NOT NULL
    )
);

-- Users can create tickets
CREATE POLICY "Users can create tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (
    auth.uid() = user_id OR
    telegram_user_id IN (
        SELECT telegram_id::BIGINT FROM public.profiles
        WHERE user_id = auth.uid() AND telegram_id IS NOT NULL
    )
);

-- Users can update their own tickets
CREATE POLICY "Users can update their own tickets"
ON public.support_tickets FOR UPDATE
USING (
    auth.uid() = user_id OR
    telegram_user_id IN (
        SELECT telegram_id::BIGINT FROM public.profiles
        WHERE user_id = auth.uid() AND telegram_id IS NOT NULL
    )
);

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
ON public.support_tickets FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND is_admin = true
    )
);

-- Admins can update all tickets
CREATE POLICY "Admins can update all tickets"
ON public.support_tickets FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND is_admin = true
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
BEGIN
    LOOP
        new_number := 'TICKET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.support_tickets WHERE ticket_number = new_number);
    END LOOP;
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- BOT_REVIEWS TABLE (for reviews via bot)
-- =============================================
CREATE TABLE IF NOT EXISTS public.bot_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    telegram_user_id BIGINT NOT NULL,
    telegram_username TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'app', 'bot', 'service', 'driver')),
    is_public BOOLEAN DEFAULT true,
    admin_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bot_reviews_user_id ON public.bot_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_reviews_telegram_user_id ON public.bot_reviews(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_bot_reviews_rating ON public.bot_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_bot_reviews_category ON public.bot_reviews(category);
CREATE INDEX IF NOT EXISTS idx_bot_reviews_created_at ON public.bot_reviews(created_at);

-- RLS Policies
ALTER TABLE public.bot_reviews ENABLE ROW LEVEL SECURITY;

-- Users can view their own reviews
CREATE POLICY "Users can view their own reviews"
ON public.bot_reviews FOR SELECT
USING (
    auth.uid() = user_id OR
    telegram_user_id IN (
        SELECT telegram_id::BIGINT FROM public.profiles
        WHERE user_id = auth.uid() AND telegram_id IS NOT NULL
    )
);

-- Public reviews can be viewed by everyone
CREATE POLICY "Public reviews can be viewed by everyone"
ON public.bot_reviews FOR SELECT
USING (is_public = true);

-- Users can create reviews
CREATE POLICY "Users can create reviews"
ON public.bot_reviews FOR INSERT
WITH CHECK (
    auth.uid() = user_id OR
    telegram_user_id IN (
        SELECT telegram_id::BIGINT FROM public.profiles
        WHERE user_id = auth.uid() AND telegram_id IS NOT NULL
    )
);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.bot_reviews FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND is_admin = true
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_bot_reviews_updated_at
BEFORE UPDATE ON public.bot_reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

