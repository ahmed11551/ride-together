-- =============================================
-- Добавление рейтинга пассажира
-- =============================================
-- Эта миграция добавляет поддержку рейтинга пассажиров,
-- который обновляется на основе отзывов от водителей
-- =============================================

-- 1. Добавляем поле passenger_rating в таблицу profiles
-- =============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS passenger_rating NUMERIC(3,2) DEFAULT 5.0;

-- Добавляем CHECK constraint для passenger_rating
ALTER TABLE public.profiles
ADD CONSTRAINT IF NOT EXISTS check_passenger_rating 
    CHECK (passenger_rating >= 0 AND passenger_rating <= 5);

-- 2. Обновляем существующие профили
-- =============================================
-- Устанавливаем начальный рейтинг 5.0 для всех существующих пользователей
UPDATE public.profiles
SET passenger_rating = 5.0
WHERE passenger_rating IS NULL;

-- 3. Создаем функцию для обновления рейтинга пассажира
-- =============================================
CREATE OR REPLACE FUNCTION public.update_passenger_rating(p_user_id UUID)
RETURNS void AS $$
DECLARE
    avg_rating NUMERIC(3,2);
    review_count INTEGER;
BEGIN
    -- Получаем средний рейтинг из отзывов, где пользователь был пассажиром
    -- (т.е. водитель оставил отзыв о пассажире)
    SELECT 
        COALESCE(AVG(rating), 5.0),
        COUNT(*)
    INTO avg_rating, review_count
    FROM public.reviews
    WHERE to_user_id = p_user_id
    AND from_user_id IN (
        -- Проверяем, что отзыв оставлен водителем поездки
        SELECT driver_id 
        FROM public.rides 
        WHERE id IN (
            SELECT ride_id 
            FROM public.reviews 
            WHERE to_user_id = p_user_id
        )
    );

    -- Обновляем рейтинг пассажира
    UPDATE public.profiles
    SET passenger_rating = ROUND(avg_rating::numeric, 2)
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Создаем функцию для обновления рейтинга водителя
-- =============================================
CREATE OR REPLACE FUNCTION public.update_driver_rating(p_user_id UUID)
RETURNS void AS $$
DECLARE
    avg_rating NUMERIC(3,2);
BEGIN
    -- Получаем средний рейтинг из отзывов, где пользователь был водителем
    SELECT COALESCE(AVG(rating), 5.0)
    INTO avg_rating
    FROM public.reviews
    WHERE to_user_id = p_user_id
    AND from_user_id IN (
        -- Проверяем, что отзыв оставлен пассажиром
        SELECT passenger_id 
        FROM public.bookings 
        WHERE ride_id IN (
            SELECT ride_id 
            FROM public.reviews 
            WHERE to_user_id = p_user_id
        )
    );

    -- Обновляем рейтинг водителя
    UPDATE public.profiles
    SET rating = ROUND(avg_rating::numeric, 2)
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Создаем универсальную функцию для обновления рейтингов
-- =============================================
CREATE OR REPLACE FUNCTION public.update_user_ratings(p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Обновляем рейтинг водителя
    PERFORM public.update_driver_rating(p_user_id);
    
    -- Обновляем рейтинг пассажира
    PERFORM public.update_passenger_rating(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Создаем триггер для автоматического обновления рейтингов при создании отзыва
-- =============================================
CREATE OR REPLACE FUNCTION public.on_review_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем рейтинг пользователя, о котором оставили отзыв
    -- Определяем, является ли он водителем или пассажиром
    PERFORM public.update_user_ratings(NEW.to_user_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Создаем триггер
DROP TRIGGER IF EXISTS trigger_update_ratings_on_review ON public.reviews;
CREATE TRIGGER trigger_update_ratings_on_review
    AFTER INSERT ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.on_review_created();

-- 7. Обновляем существующие рейтинги на основе текущих отзывов
-- =============================================
-- Это можно выполнить вручную или через Edge Function
-- Для автоматического обновления всех рейтингов:
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT user_id FROM public.profiles
    LOOP
        PERFORM public.update_user_ratings(user_record.user_id);
    END LOOP;
END $$;

-- Комментарии
COMMENT ON COLUMN public.profiles.passenger_rating IS 
    'Рейтинг пассажира на основе отзывов от водителей (0-5)';

COMMENT ON FUNCTION public.update_passenger_rating(UUID) IS 
    'Обновляет рейтинг пассажира на основе отзывов от водителей';

COMMENT ON FUNCTION public.update_driver_rating(UUID) IS 
    'Обновляет рейтинг водителя на основе отзывов от пассажиров';

COMMENT ON FUNCTION public.update_user_ratings(UUID) IS 
    'Обновляет оба рейтинга (водителя и пассажира) для пользователя';
