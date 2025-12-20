-- Таблица для сохранения поисковых запросов
CREATE TABLE IF NOT EXISTS public.saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT,
    from_city TEXT,
    to_city TEXT,
    date TEXT,
    date_from TEXT,
    date_to TEXT,
    time_from TEXT,
    time_to TEXT,
    passengers INTEGER DEFAULT 1,
    min_price DECIMAL(10,2),
    max_price DECIMAL(10,2),
    allow_smoking BOOLEAN,
    allow_pets BOOLEAN,
    allow_music BOOLEAN,
    min_rating DECIMAL(3,2),
    sort_by TEXT DEFAULT 'departure',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON public.saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_last_searched_at ON public.saved_searches(last_searched_at DESC);

