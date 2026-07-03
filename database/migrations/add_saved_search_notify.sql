-- Уведомления Telegram для сохранённых поисков
ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS notify_telegram BOOLEAN DEFAULT true NOT NULL;
