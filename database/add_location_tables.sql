-- Таблица для хранения текущего местоположения пользователей
CREATE TABLE IF NOT EXISTS public.user_locations (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_locations_updated_at ON public.user_locations(updated_at);

-- Таблица для хранения координат поездок (кэш геокодинга)
-- Можно добавить позже для оптимизации, если нужно
CREATE TABLE IF NOT EXISTS public.ride_coordinates (
    ride_id UUID PRIMARY KEY REFERENCES public.rides(id) ON DELETE CASCADE,
    from_lat DECIMAL(10, 8),
    from_lng DECIMAL(11, 8),
    to_lat DECIMAL(10, 8),
    to_lng DECIMAL(11, 8),
    distance_km DECIMAL(10, 2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ride_coordinates_from ON public.ride_coordinates(from_lat, from_lng);
CREATE INDEX IF NOT EXISTS idx_ride_coordinates_to ON public.ride_coordinates(to_lat, to_lng);

