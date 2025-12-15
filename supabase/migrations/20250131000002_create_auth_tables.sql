-- =============================================
-- Создание таблиц для собственной Auth системы
-- Замена Supabase Auth на собственную реализацию
-- =============================================

-- 1. Таблица пользователей (замена auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token TEXT,
    password_reset_token TEXT,
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Индексы для users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON public.users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON public.users(password_reset_token);

-- 2. Таблица сессий
-- =============================================
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT UNIQUE NOT NULL,
    refresh_token TEXT UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    refresh_expires_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Индексы для sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON public.sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);

-- 3. Миграция данных из auth.users (если есть доступ)
-- =============================================
-- ВНИМАНИЕ: Это нужно выполнить после экспорта данных
-- Если у вас есть доступ к auth.users, можно мигрировать:
/*
INSERT INTO public.users (id, email, email_verified, created_at)
SELECT 
    id, 
    email, 
    COALESCE(email_confirmed_at IS NOT NULL, false) as email_verified,
    created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;
*/

-- 4. Обновление profiles для связи с новой таблицей users
-- =============================================
-- Если profiles.user_id ссылается на auth.users, нужно обновить foreign key
-- Но обычно profiles.user_id уже правильный, просто нужно убедиться что данные совпадают

-- 5. RLS политики для users
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Пользователи могут видеть только свой профиль
CREATE POLICY "Users can view own user"
ON public.users FOR SELECT
USING (id = current_user_id());

-- Пользователи могут обновлять только свой профиль
CREATE POLICY "Users can update own user"
ON public.users FOR UPDATE
USING (id = current_user_id());

-- 6. RLS политики для sessions
-- =============================================
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Пользователи могут видеть только свои сессии
CREATE POLICY "Users can view own sessions"
ON public.sessions FOR SELECT
USING (user_id = current_user_id());

-- Пользователи могут удалять только свои сессии
CREATE POLICY "Users can delete own sessions"
ON public.sessions FOR DELETE
USING (user_id = current_user_id());

-- 7. Функция для получения текущего пользователя
-- =============================================
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
BEGIN
  -- Эта функция будет использоваться в RLS политиках
  -- В реальности нужно передавать user_id через JWT или сессию
  -- Пока возвращаем NULL (нужно будет настроить через application context)
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. Триггер для обновления updated_at
-- =============================================
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_last_used_at
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Функция для очистки истекших сессий
-- =============================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.sessions
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Комментарии
COMMENT ON TABLE public.users IS 
    'Таблица пользователей (замена auth.users из Supabase)';

COMMENT ON TABLE public.sessions IS 
    'Таблица сессий для хранения JWT токенов';

COMMENT ON FUNCTION public.current_user_id() IS 
    'Возвращает ID текущего пользователя (нужно настроить через application context)';

COMMENT ON FUNCTION public.cleanup_expired_sessions() IS 
    'Удаляет истекшие сессии (можно запускать по расписанию)';
