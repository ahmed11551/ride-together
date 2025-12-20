-- Таблица для хранения уведомлений
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    url TEXT,
    read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Добавляем поля для настройки уведомлений в profiles, если их нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email_notifications'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN email_notifications BOOLEAN DEFAULT true,
        ADD COLUMN push_notifications BOOLEAN DEFAULT true,
        ADD COLUMN telegram_notifications BOOLEAN DEFAULT false,
        ADD COLUMN sms_notifications BOOLEAN DEFAULT false;
    END IF;
END $$;

