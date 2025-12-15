-- =============================================
-- ПОЛНАЯ СХЕМА БД ДЛЯ TIMEWEB CLOUD
-- Создано автоматически из всех миграций
-- Адаптировано для работы без Supabase Auth
-- =============================================
-- Просто скопируй весь этот файл и выполни в SQL Editor Timeweb
-- =============================================

BEGIN;

-- =============================================
-- 1. СОЗДАНИЕ ТАБЛИЦЫ ПОЛЬЗОВАТЕЛЕЙ (Auth система)
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

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON public.users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON public.users(password_reset_token);

-- =============================================
-- 2. ТАБЛИЦА СЕССИЙ
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

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON public.sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);

-- =============================================
-- 3. ТАБЛИЦА ПРОФИЛЕЙ
-- =============================================

CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT,
    phone TEXT,
    bio TEXT,
    avatar_url TEXT,
    rating NUMERIC(3,2) DEFAULT 5.0,
    passenger_rating NUMERIC(3,2) DEFAULT 5.0,
    trips_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    telegram_id TEXT UNIQUE,
    telegram_username TEXT,
    telegram_first_name TEXT,
    telegram_last_name TEXT,
    telegram_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT check_rating CHECK (rating >= 0 AND rating <= 5),
    CONSTRAINT check_passenger_rating CHECK (passenger_rating >= 0 AND passenger_rating <= 5),
    CONSTRAINT check_trips_count CHECK (trips_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles(rating) WHERE rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON public.profiles(telegram_id);

-- =============================================
-- 4. ТАБЛИЦА ИНФОРМАЦИИ О ВОДИТЕЛЯХ
-- =============================================

CREATE TABLE IF NOT EXISTS public.driver_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    car_make TEXT,
    car_model TEXT,
    car_year INTEGER,
    car_color TEXT,
    license_plate TEXT,
    driver_license TEXT,
    car_photo_url TEXT,
    license_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =============================================
-- 5. ТАБЛИЦА ПОЕЗДОК
-- =============================================

CREATE TYPE public.ride_status AS ENUM ('active', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS public.rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    departure_location TEXT NOT NULL,
    departure_latitude DOUBLE PRECISION,
    departure_longitude DOUBLE PRECISION,
    destination_location TEXT NOT NULL,
    destination_latitude DOUBLE PRECISION,
    destination_longitude DOUBLE PRECISION,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    seats_total INTEGER NOT NULL DEFAULT 4,
    seats_available INTEGER NOT NULL DEFAULT 4,
    price NUMERIC(10,2) NOT NULL,
    status public.ride_status DEFAULT 'active' NOT NULL,
    description TEXT,
    notes TEXT,
    estimated_duration TEXT,
    allow_smoking BOOLEAN DEFAULT false,
    allow_pets BOOLEAN DEFAULT false,
    allow_music BOOLEAN DEFAULT true,
    from_city TEXT,
    from_address TEXT,
    to_city TEXT,
    to_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT check_seats_available CHECK (seats_available >= 0 AND seats_available <= seats_total),
    CONSTRAINT check_seats_total CHECK (seats_total > 0 AND seats_total <= 10),
    CONSTRAINT check_price CHECK (price >= 0 AND price <= 1000000),
    CONSTRAINT check_departure_date CHECK (departure_date >= CURRENT_DATE)
);

CREATE INDEX IF NOT EXISTS idx_rides_status_date_active ON public.rides(status, departure_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_rides_driver_status ON public.rides(driver_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_departure ON public.rides(departure_date, departure_time);
CREATE INDEX IF NOT EXISTS idx_rides_from_to ON public.rides(from_city, to_city);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);

-- =============================================
-- 6. ТАБЛИЦА БРОНИРОВАНИЙ
-- =============================================

CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'refunded');

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
    passenger_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    seats_booked INTEGER NOT NULL DEFAULT 1,
    total_price NUMERIC(10,2) NOT NULL,
    status public.booking_status DEFAULT 'pending' NOT NULL,
    payment_status public.payment_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(ride_id, passenger_id),
    CONSTRAINT check_seats_booked CHECK (seats_booked > 0 AND seats_booked <= 10),
    CONSTRAINT check_total_price CHECK (total_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_bookings_status_ride ON public.bookings(status, ride_id) WHERE status IN ('pending', 'confirmed');
CREATE INDEX IF NOT EXISTS idx_bookings_passenger ON public.bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_ride ON public.bookings(ride_id);

-- =============================================
-- 7. ТАБЛИЦА СООБЩЕНИЙ
-- =============================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(ride_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_ride ON public.messages(ride_id);

-- =============================================
-- 8. ТАБЛИЦА ОТЗЫВОВ
-- =============================================

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    reviewed_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(ride_id, reviewer_id, reviewed_id),
    CONSTRAINT check_rating_value CHECK (rating >= 1 AND rating <= 5)
);

-- =============================================
-- 9. ТАБЛИЦА ЖАЛОБ
-- =============================================

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    reported_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    ride_id UUID REFERENCES public.rides(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON public.reports(reported_user_id);

-- =============================================
-- 10. ТАБЛИЦА ПОДПИСОК TELEGRAM
-- =============================================

CREATE TABLE IF NOT EXISTS public.telegram_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    telegram_chat_id BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id, telegram_chat_id)
);

-- =============================================
-- 11. ТАБЛИЦА ТИКЕТОВ ПОДДЕРЖКИ
-- =============================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    telegram_user_id BIGINT,
    telegram_username TEXT,
    ticket_number TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'technical', 'payment', 'booking', 'other')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID REFERENCES public.users(id),
    admin_response TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_telegram_user_id ON public.support_tickets(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number ON public.support_tickets(ticket_number);

-- =============================================
-- 12. ТАБЛИЦА ПОДПИСОК (Telegram bot)
-- =============================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_telegram_user_id ON public.subscriptions(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(subscription_status);

-- =============================================
-- 13. ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ БОТА
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

CREATE INDEX IF NOT EXISTS idx_bot_users_telegram_user_id ON public.bot_users(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_bot_users_subscribed ON public.bot_users(is_subscribed);

-- =============================================
-- 14. ТАБЛИЦА РЕФЕРРАЛОВ
-- =============================================

CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_telegram_id BIGINT NOT NULL,
    referred_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    referred_telegram_id BIGINT,
    referral_code TEXT UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    reward_type TEXT CHECK (reward_type IN ('subscription_days', 'premium_access', 'discount')),
    reward_value INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_telegram_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user ON public.referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);

-- =============================================
-- 15. ТАБЛИЦА ОТЗЫВОВ ЧЕРЕЗ БОТА
-- =============================================

CREATE TABLE IF NOT EXISTS public.bot_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_bot_reviews_user_id ON public.bot_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_reviews_telegram_user_id ON public.bot_reviews(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_bot_reviews_rating ON public.bot_reviews(rating);

-- =============================================
-- ФУНКЦИИ
-- =============================================

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Функция создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, rating, passenger_rating)
    VALUES (NEW.id, COALESCE(NEW.email, 'Пользователь'), 5.0, 5.0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Функция обновления мест при бронировании (с защитой от race conditions)
CREATE OR REPLACE FUNCTION public.update_seats_on_booking()
RETURNS TRIGGER AS $$
DECLARE
    current_seats INTEGER;
    ride_status TEXT;
    total_seats INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT seats_available, status::TEXT, seats_total 
        INTO current_seats, ride_status, total_seats
        FROM public.rides
        WHERE id = NEW.ride_id
        FOR UPDATE;
        
        IF ride_status != 'active' THEN
            RAISE EXCEPTION 'Поездка не активна. Статус: %', ride_status;
        END IF;
        
        IF current_seats < NEW.seats_booked THEN
            RAISE EXCEPTION 'Недостаточно свободных мест. Доступно: %, запрошено: %', current_seats, NEW.seats_booked;
        END IF;
        
        IF NEW.status::TEXT = 'pending' THEN
            UPDATE public.rides 
            SET seats_available = seats_available - NEW.seats_booked
            WHERE id = NEW.ride_id;
        END IF;
        
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status::TEXT = 'pending' AND NEW.status::TEXT = 'cancelled' THEN
            UPDATE public.rides 
            SET seats_available = seats_available + OLD.seats_booked
            WHERE id = OLD.ride_id;
        ELSIF OLD.status::TEXT = 'confirmed' AND NEW.status::TEXT = 'cancelled' THEN
            UPDATE public.rides 
            SET seats_available = seats_available + OLD.seats_booked
            WHERE id = OLD.ride_id;
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status::TEXT != 'cancelled' THEN
            UPDATE public.rides 
            SET seats_available = seats_available + OLD.seats_booked
            WHERE id = OLD.ride_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Функция обновления рейтинга водителя
CREATE OR REPLACE FUNCTION public.update_driver_rating(p_user_id UUID)
RETURNS void AS $$
DECLARE
    avg_rating NUMERIC(3,2);
BEGIN
    SELECT COALESCE(AVG(rating), 5.0)
    INTO avg_rating
    FROM public.reviews
    WHERE reviewed_id = p_user_id
    AND EXISTS (
        SELECT 1 FROM public.rides 
        WHERE driver_id = p_user_id AND id = reviews.ride_id
    );
    
    UPDATE public.profiles
    SET rating = ROUND(COALESCE(avg_rating, 5.0)::numeric, 2)
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Функция обновления рейтинга пассажира
CREATE OR REPLACE FUNCTION public.update_passenger_rating(p_user_id UUID)
RETURNS void AS $$
DECLARE
    avg_rating NUMERIC(3,2);
BEGIN
    SELECT COALESCE(AVG(rating), 5.0)
    INTO avg_rating
    FROM public.reviews
    WHERE reviewed_id = p_user_id
    AND EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE passenger_id = p_user_id AND ride_id = reviews.ride_id
    );
    
    UPDATE public.profiles
    SET passenger_rating = ROUND(COALESCE(avg_rating, 5.0)::numeric, 2)
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Универсальная функция обновления рейтингов
CREATE OR REPLACE FUNCTION public.update_user_ratings(p_user_id UUID)
RETURNS void AS $$
BEGIN
    PERFORM public.update_driver_rating(p_user_id);
    PERFORM public.update_passenger_rating(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Функция обработки создания отзыва
CREATE OR REPLACE FUNCTION public.on_review_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.update_user_ratings(NEW.reviewed_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Функция проверки участия в поездке
CREATE OR REPLACE FUNCTION public.is_ride_participant(p_ride_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.rides WHERE id = p_ride_id AND driver_id = p_user_id
    ) OR EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE ride_id = p_ride_id AND passenger_id = p_user_id AND status IN ('pending', 'confirmed')
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Функция очистки истекших поездок
CREATE OR REPLACE FUNCTION public.cleanup_old_rides()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE public.rides
    SET status = 'completed'
    WHERE status = 'active' AND departure_date < CURRENT_DATE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Функция для получения текущего пользователя (для RLS)
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
BEGIN
    -- Эта функция будет использоваться в RLS политиках
    -- В реальности нужно передавать user_id через JWT или сессию
    -- Пока возвращаем NULL (нужно будет настроить через application context)
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Функция очистки истекших сессий
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

-- =============================================
-- ТРИГГЕРЫ
-- =============================================

-- Триггеры обновления updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_last_used_at
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rides_updated_at
    BEFORE UPDATE ON public.rides
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_info_updated_at
    BEFORE UPDATE ON public.driver_info
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bot_users_updated_at
    BEFORE UPDATE ON public.bot_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bot_reviews_updated_at
    BEFORE UPDATE ON public.bot_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Функция генерации номера тикета
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
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

-- Триггер создания профиля при создании пользователя
DROP TRIGGER IF EXISTS on_user_created ON public.users;
CREATE TRIGGER on_user_created
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Триггер обновления мест при бронировании
DROP TRIGGER IF EXISTS trigger_update_seats_on_booking ON public.bookings;
CREATE TRIGGER trigger_update_seats_on_booking
    AFTER INSERT OR UPDATE OR DELETE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_seats_on_booking();

-- Триггер обновления рейтингов при создании отзыва
DROP TRIGGER IF EXISTS trigger_update_ratings_on_review ON public.reviews;
CREATE TRIGGER trigger_update_ratings_on_review
    AFTER INSERT ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.on_review_created();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Включаем RLS для всех таблиц
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_reviews ENABLE ROW LEVEL SECURITY;

-- Политики для users (временно разрешаем все, потом настроим через JWT)
DROP POLICY IF EXISTS "Users can view own user" ON public.users;
CREATE POLICY "Users can view own user" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own user" ON public.users;
CREATE POLICY "Users can update own user" ON public.users FOR UPDATE USING (true);

-- Политики для sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
CREATE POLICY "Users can view own sessions" ON public.sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;
CREATE POLICY "Users can delete own sessions" ON public.sessions FOR DELETE USING (true);

-- Политики для profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (true);

-- Политики для rides
DROP POLICY IF EXISTS "Rides are viewable by everyone" ON public.rides;
CREATE POLICY "Rides are viewable by everyone" ON public.rides FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create rides" ON public.rides;
CREATE POLICY "Users can create rides" ON public.rides FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own rides" ON public.rides;
CREATE POLICY "Users can update own rides" ON public.rides FOR UPDATE USING (true);

-- Политики для bookings
DROP POLICY IF EXISTS "Bookings are viewable by participants" ON public.bookings;
CREATE POLICY "Bookings are viewable by participants" ON public.bookings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (true);

-- Политики для messages
DROP POLICY IF EXISTS "Messages are viewable by ride participants" ON public.messages;
CREATE POLICY "Messages are viewable by ride participants" ON public.messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create messages" ON public.messages;
CREATE POLICY "Users can create messages" ON public.messages FOR INSERT WITH CHECK (true);

-- Политики для reviews
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- Политики для reports
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
CREATE POLICY "Users can view their own reports" ON public.reports FOR SELECT USING (true);

-- Политики для telegram_subscriptions
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.telegram_subscriptions;
CREATE POLICY "Users can manage own subscriptions" ON public.telegram_subscriptions FOR ALL USING (true);

-- Политики для support_tickets
DROP POLICY IF EXISTS "Users can manage own tickets" ON public.support_tickets;
CREATE POLICY "Users can manage own tickets" ON public.support_tickets FOR ALL USING (true);

-- Политики для subscriptions
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can manage own subscriptions" ON public.subscriptions FOR ALL USING (true);

-- Политики для bot_users
DROP POLICY IF EXISTS "Everyone can view bot users" ON public.bot_users;
CREATE POLICY "Everyone can view bot users" ON public.bot_users FOR SELECT USING (true);

-- Политики для referrals
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (true);

-- Политики для bot_reviews
DROP POLICY IF EXISTS "Users can view own reviews" ON public.bot_reviews;
CREATE POLICY "Users can view own reviews" ON public.bot_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public reviews can be viewed by everyone" ON public.bot_reviews;
CREATE POLICY "Public reviews can be viewed by everyone" ON public.bot_reviews FOR SELECT USING (is_public = true);

-- =============================================
-- КОММЕНТАРИИ
-- =============================================

COMMENT ON TABLE public.users IS 'Таблица пользователей (замена auth.users из Supabase)';
COMMENT ON TABLE public.sessions IS 'Таблица сессий для хранения JWT токенов';
COMMENT ON TABLE public.profiles IS 'Профили пользователей';
COMMENT ON TABLE public.rides IS 'Поездки';
COMMENT ON TABLE public.bookings IS 'Бронирования';
COMMENT ON TABLE public.messages IS 'Сообщения в чате поездок';
COMMENT ON TABLE public.reviews IS 'Отзывы о пользователях';
COMMENT ON TABLE public.reports IS 'Жалобы на пользователей';
COMMENT ON TABLE public.telegram_subscriptions IS 'Подписки на уведомления Telegram';
COMMENT ON TABLE public.support_tickets IS 'Тикеты поддержки';
COMMENT ON TABLE public.subscriptions IS 'Подписки на Telegram бота';
COMMENT ON TABLE public.bot_users IS 'Пользователи Telegram бота';
COMMENT ON TABLE public.referrals IS 'Реферальная программа';
COMMENT ON TABLE public.bot_reviews IS 'Отзывы через Telegram бота';

COMMIT;

-- =============================================
-- ГОТОВО!
-- =============================================
-- Теперь можно добавлять данные вручную или через API
-- Все таблицы созданы, функции работают, триггеры активны
-- =============================================
