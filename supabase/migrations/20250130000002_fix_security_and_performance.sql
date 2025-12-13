-- =============================================
-- ФАЗА 1: КРИТИЧЕСКИЕ ИСПРАВЛЕНИЯ БЕЗОПАСНОСТИ
-- =============================================

-- 1. ИСПРАВЛЕНИЕ ФУНКЦИЙ БЕЗ SET search_path
-- =============================================

-- Исправляем handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Исправляем cleanup_old_rides
CREATE OR REPLACE FUNCTION public.cleanup_old_rides()
RETURNS TABLE(deleted_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_rides INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.rides
    WHERE (
      (status = 'cancelled' AND updated_at < NOW() - INTERVAL '30 days')
      OR
      (status = 'completed' AND updated_at < NOW() - INTERVAL '30 days')
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_rides FROM deleted;
  
  RETURN QUERY SELECT deleted_rides;
END;
$$;

-- Исправляем cleanup_user_old_rides
CREATE OR REPLACE FUNCTION public.cleanup_user_old_rides(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.rides
    WHERE driver_id = user_uuid
      AND (
        (status = 'cancelled' AND updated_at < NOW() - INTERVAL '30 days')
        OR
        (status = 'completed' AND updated_at < NOW() - INTERVAL '30 days')
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;

-- Исправляем update_push_subscriptions_updated_at
CREATE OR REPLACE FUNCTION public.update_push_subscriptions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Исправляем cleanup_old_ride_locations
CREATE OR REPLACE FUNCTION public.cleanup_old_ride_locations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.ride_locations
  WHERE timestamp < NOW() - INTERVAL '24 hours';
END;
$$;

-- 2. ОПТИМИЗАЦИЯ RLS POLICIES
-- =============================================
-- Заменяем auth.uid() на (select auth.uid()) для лучшей производительности

-- Profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

-- Объединенная SELECT policy для profiles
CREATE POLICY "profiles_select_policy"
ON public.profiles FOR SELECT
USING (true);

-- Объединенная INSERT policy для profiles
CREATE POLICY "profiles_insert_policy"
ON public.profiles FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

-- Объединенная UPDATE policy для profiles
CREATE POLICY "profiles_update_policy"
ON public.profiles FOR UPDATE
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Driver info policies
DROP POLICY IF EXISTS "Users can insert their own driver info" ON public.driver_info;
DROP POLICY IF EXISTS "Users can update their own driver info" ON public.driver_info;

CREATE POLICY "driver_info_insert_policy"
ON public.driver_info FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "driver_info_update_policy"
ON public.driver_info FOR UPDATE
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Rides policies
DROP POLICY IF EXISTS "Authenticated users can create rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers can update their own rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers can delete their own rides" ON public.rides;

CREATE POLICY "rides_insert_policy"
ON public.rides FOR INSERT
WITH CHECK ((select auth.uid()) = driver_id);

CREATE POLICY "rides_update_policy"
ON public.rides FOR UPDATE
USING ((select auth.uid()) = driver_id)
WITH CHECK ((select auth.uid()) = driver_id);

CREATE POLICY "rides_delete_policy"
ON public.rides FOR DELETE
USING ((select auth.uid()) = driver_id);

-- Bookings policies
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;

CREATE POLICY "bookings_insert_policy"
ON public.bookings FOR INSERT
WITH CHECK ((select auth.uid()) = passenger_id);

CREATE POLICY "bookings_update_policy"
ON public.bookings FOR UPDATE
USING ((select auth.uid()) = passenger_id)
WITH CHECK ((select auth.uid()) = passenger_id);

CREATE POLICY "bookings_select_policy"
ON public.bookings FOR SELECT
USING (
  (select auth.uid()) = passenger_id OR
  (select auth.uid()) IN (SELECT driver_id FROM public.rides WHERE id = bookings.ride_id)
);

-- Messages policies
DROP POLICY IF EXISTS "Ride participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Ride participants can send messages" ON public.messages;

CREATE POLICY "messages_select_policy"
ON public.messages FOR SELECT
USING (
  (select auth.uid()) IN (SELECT driver_id FROM public.rides WHERE id = messages.ride_id) OR
  (select auth.uid()) IN (SELECT passenger_id FROM public.bookings WHERE ride_id = messages.ride_id)
);

CREATE POLICY "messages_insert_policy"
ON public.messages FOR INSERT
WITH CHECK (
  (select auth.uid()) = sender_id AND (
    (select auth.uid()) IN (SELECT driver_id FROM public.rides WHERE id = ride_id) OR
    (select auth.uid()) IN (SELECT passenger_id FROM public.bookings WHERE ride_id = messages.ride_id)
  )
);

-- Reviews policies
DROP POLICY IF EXISTS "Users can create reviews for their rides" ON public.reviews;

CREATE POLICY "reviews_insert_policy"
ON public.reviews FOR INSERT
WITH CHECK ((select auth.uid()) = from_user_id);

-- Reports policies
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;

CREATE POLICY "reports_insert_policy"
ON public.reports FOR INSERT
WITH CHECK ((select auth.uid()) = reporter_id);

-- Объединенная SELECT policy для reports
CREATE POLICY "reports_select_policy"
ON public.reports FOR SELECT
USING (
  (select auth.uid()) = reporter_id OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = (select auth.uid()) AND is_admin = true
  )
);

CREATE POLICY "reports_update_policy"
ON public.reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = (select auth.uid()) AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = (select auth.uid()) AND is_admin = true
  )
);

-- Push subscriptions policies
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can read their own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON public.push_subscriptions;

CREATE POLICY "push_subscriptions_insert_policy"
ON public.push_subscriptions FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "push_subscriptions_select_policy"
ON public.push_subscriptions FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "push_subscriptions_update_policy"
ON public.push_subscriptions FOR UPDATE
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "push_subscriptions_delete_policy"
ON public.push_subscriptions FOR DELETE
USING ((select auth.uid()) = user_id);

-- Ride locations policies
DROP POLICY IF EXISTS "Drivers can insert their own locations" ON public.ride_locations;
DROP POLICY IF EXISTS "Drivers can read their own locations" ON public.ride_locations;
DROP POLICY IF EXISTS "Passengers can read locations of their rides" ON public.ride_locations;

CREATE POLICY "ride_locations_insert_policy"
ON public.ride_locations FOR INSERT
WITH CHECK ((select auth.uid()) = driver_id);

-- Объединенная SELECT policy для ride_locations
CREATE POLICY "ride_locations_select_policy"
ON public.ride_locations FOR SELECT
USING (
  (select auth.uid()) = driver_id OR
  (select auth.uid()) IN (
    SELECT passenger_id FROM public.bookings
    WHERE ride_id = ride_locations.ride_id AND status = 'confirmed'
  )
);

-- 3. ДОБАВЛЕНИЕ ИНДЕКСОВ НА FOREIGN KEYS
-- =============================================

-- Bookings foreign keys
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_id ON public.bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_ride_id ON public.bookings(ride_id);

-- Messages foreign keys
CREATE INDEX IF NOT EXISTS idx_messages_ride_id ON public.messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- Reports foreign keys
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_ride_id ON public.reports(ride_id);

-- Reviews foreign keys
CREATE INDEX IF NOT EXISTS idx_reviews_from_user_id ON public.reviews(from_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_to_user_id ON public.reviews(to_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_ride_id ON public.reviews(ride_id);

-- Ride locations foreign keys
CREATE INDEX IF NOT EXISTS idx_ride_locations_ride_id ON public.ride_locations(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_locations_driver_id ON public.ride_locations(driver_id);

-- Push subscriptions foreign key
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Driver info foreign key
CREATE INDEX IF NOT EXISTS idx_driver_info_user_id ON public.driver_info(user_id);

-- Комментарии
COMMENT ON FUNCTION public.handle_updated_at() IS 'Обновляет updated_at timestamp. Исправлено: добавлен SET search_path для безопасности.';
COMMENT ON FUNCTION public.cleanup_old_rides() IS 'Удаляет старые поездки. Исправлено: добавлен SET search_path для безопасности.';
COMMENT ON FUNCTION public.cleanup_user_old_rides(UUID) IS 'Удаляет старые поездки пользователя. Исправлено: добавлен SET search_path для безопасности.';
COMMENT ON FUNCTION public.update_push_subscriptions_updated_at() IS 'Обновляет updated_at для push_subscriptions. Исправлено: добавлен SET search_path для безопасности.';
COMMENT ON FUNCTION public.cleanup_old_ride_locations() IS 'Удаляет старые локации поездок. Исправлено: добавлен SET search_path для безопасности.';

