-- =============================================
-- Улучшение стабильности базы данных
-- Критичные исправления для предотвращения race conditions и некорректных данных
-- =============================================

-- 1. ДОБАВЛЕНИЕ CHECK CONSTRAINTS
-- =============================================

-- Проверки для rides
ALTER TABLE public.rides
ADD CONSTRAINT IF NOT EXISTS check_seats_available 
    CHECK (seats_available >= 0 AND seats_available <= seats_total);

ALTER TABLE public.rides
ADD CONSTRAINT IF NOT EXISTS check_seats_total 
    CHECK (seats_total > 0 AND seats_total <= 10);

ALTER TABLE public.rides
ADD CONSTRAINT IF NOT EXISTS check_price 
    CHECK (price >= 0 AND price <= 1000000);

ALTER TABLE public.rides
ADD CONSTRAINT IF NOT EXISTS check_departure_date 
    CHECK (departure_date >= CURRENT_DATE);

-- Проверки для bookings
ALTER TABLE public.bookings
ADD CONSTRAINT IF NOT EXISTS check_seats_booked 
    CHECK (seats_booked > 0 AND seats_booked <= 10);

ALTER TABLE public.bookings
ADD CONSTRAINT IF NOT EXISTS check_total_price 
    CHECK (total_price >= 0);

-- Проверки для profiles
ALTER TABLE public.profiles
ADD CONSTRAINT IF NOT EXISTS check_rating 
    CHECK (rating >= 0 AND rating <= 5);

ALTER TABLE public.profiles
ADD CONSTRAINT IF NOT EXISTS check_trips_count 
    CHECK (trips_count >= 0);

-- 2. УЛУЧШЕНИЕ ТРИГГЕРА БРОНИРОВАНИЙ (защита от race conditions)
-- =============================================

CREATE OR REPLACE FUNCTION public.update_seats_on_booking()
RETURNS TRIGGER AS $$
DECLARE
    current_seats INTEGER;
    ride_status TEXT;
    total_seats INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Блокируем строку для обновления (защита от race condition)
        SELECT seats_available, status, seats_total 
        INTO current_seats, ride_status, total_seats
        FROM public.rides
        WHERE id = NEW.ride_id
        FOR UPDATE;
        
        -- Проверяем статус поездки
        IF ride_status != 'active' THEN
            RAISE EXCEPTION 'Поездка не активна. Статус: %', ride_status;
        END IF;
        
        -- Проверяем доступность мест
        IF current_seats < NEW.seats_booked THEN
            RAISE EXCEPTION 'Недостаточно свободных мест. Доступно: %, запрошено: %', 
                current_seats, NEW.seats_booked;
        END IF;
        
        -- Проверяем, что не превышаем общее количество мест
        IF (total_seats - current_seats + NEW.seats_booked) > total_seats THEN
            RAISE EXCEPTION 'Превышено общее количество мест';
        END IF;
        
        -- Обновляем места только для pending бронирований
        IF NEW.status = 'pending' THEN
            UPDATE public.rides 
            SET seats_available = seats_available - NEW.seats_booked
            WHERE id = NEW.ride_id;
        END IF;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Если статус изменился с pending на confirmed
        IF OLD.status = 'pending' AND NEW.status = 'confirmed' THEN
            -- Места уже заняты при создании, ничего не делаем
            NULL;
        ELSIF OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
            -- Возвращаем места при отмене pending бронирования
            UPDATE public.rides 
            SET seats_available = seats_available + OLD.seats_booked
            WHERE id = OLD.ride_id;
        ELSIF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
            -- Возвращаем места при отмене confirmed бронирования
            UPDATE public.rides 
            SET seats_available = seats_available + OLD.seats_booked
            WHERE id = OLD.ride_id;
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Возвращаем места при удалении (только если не было cancelled)
        IF OLD.status != 'cancelled' THEN
            UPDATE public.rides 
            SET seats_available = seats_available + OLD.seats_booked
            WHERE id = OLD.ride_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. ДОБАВЛЕНИЕ НЕДОСТАЮЩИХ ИНДЕКСОВ
-- =============================================

-- Для поиска активных поездок по дате
CREATE INDEX IF NOT EXISTS idx_rides_status_date_active 
ON public.rides(status, departure_date) 
WHERE status = 'active';

-- Для поиска активных бронирований
CREATE INDEX IF NOT EXISTS idx_bookings_status_ride 
ON public.bookings(status, ride_id) 
WHERE status IN ('pending', 'confirmed');

-- Для сортировки сообщений по времени
CREATE INDEX IF NOT EXISTS idx_messages_created_at 
ON public.messages(ride_id, created_at DESC);

-- Для поиска по рейтингу
CREATE INDEX IF NOT EXISTS idx_profiles_rating 
ON public.profiles(rating) 
WHERE rating IS NOT NULL;

-- Для поиска поездок водителя по статусу
CREATE INDEX IF NOT EXISTS idx_rides_driver_status 
ON public.rides(driver_id, status, created_at DESC);

-- 4. ФУНКЦИЯ ДЛЯ ПРОВЕРКИ УЧАСТИЯ В ПОЕЗДКЕ (оптимизация RLS)
-- =============================================

CREATE OR REPLACE FUNCTION public.is_ride_participant(
    p_ride_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.rides 
        WHERE id = p_ride_id AND driver_id = p_user_id
    ) OR EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE ride_id = p_ride_id 
        AND passenger_id = p_user_id
        AND status IN ('pending', 'confirmed')
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Комментарии
COMMENT ON FUNCTION public.update_seats_on_booking() IS 
    'Обновляет количество свободных мест при изменении бронирований. Защищено от race conditions.';

COMMENT ON FUNCTION public.is_ride_participant(UUID, UUID) IS 
    'Проверяет, является ли пользователь участником поездки (водитель или пассажир).';

COMMENT ON CONSTRAINT check_seats_available ON public.rides IS 
    'Проверяет, что свободных мест не меньше 0 и не больше общего количества.';

COMMENT ON CONSTRAINT check_seats_booked ON public.bookings IS 
    'Проверяет, что забронировано от 1 до 10 мест.';
