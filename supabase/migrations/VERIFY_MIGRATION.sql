-- =============================================
-- Скрипт для проверки успешного применения миграции
-- 20250131000000_improve_database_stability.sql
-- =============================================
-- Выполните этот скрипт в Supabase SQL Editor после применения миграции
-- =============================================

-- 1. ПРОВЕРКА CHECK CONSTRAINTS
-- =============================================
SELECT 
    'CHECK CONSTRAINTS' AS check_type,
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid IN (
    'public.rides'::regclass,
    'public.bookings'::regclass,
    'public.profiles'::regclass
)
AND conname LIKE 'check_%'
ORDER BY conrelid::regclass::text, conname;

-- Ожидаемый результат: 8 constraints
-- - check_seats_available (rides)
-- - check_seats_total (rides)
-- - check_price (rides)
-- - check_departure_date (rides)
-- - check_seats_booked (bookings)
-- - check_total_price (bookings)
-- - check_rating (profiles)
-- - check_trips_count (profiles)

-- 2. ПРОВЕРКА УЛУЧШЕННОЙ ФУНКЦИИ ТРИГГЕРА
-- =============================================
SELECT 
    'TRIGGER FUNCTION' AS check_type,
    proname AS function_name,
    CASE 
        WHEN prosrc LIKE '%FOR UPDATE%' THEN '✅ Защита от race condition есть'
        ELSE '❌ Защита от race condition отсутствует'
    END AS race_condition_protection,
    CASE 
        WHEN prosrc LIKE '%RAISE EXCEPTION%' THEN '✅ Проверки доступности мест есть'
        ELSE '❌ Проверки доступности мест отсутствуют'
    END AS validation_checks
FROM pg_proc
WHERE proname = 'update_seats_on_booking';

-- Ожидаемый результат: функция должна содержать "FOR UPDATE" и "RAISE EXCEPTION"

-- 3. ПРОВЕРКА НОВЫХ ИНДЕКСОВ
-- =============================================
SELECT 
    'INDEXES' AS check_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
    'idx_rides_status_date_active',
    'idx_bookings_status_ride',
    'idx_messages_created_at',
    'idx_profiles_rating',
    'idx_rides_driver_status'
)
ORDER BY tablename, indexname;

-- Ожидаемый результат: 5 индексов должны существовать

-- 4. ПРОВЕРКА ФУНКЦИИ is_ride_participant
-- =============================================
SELECT 
    'HELPER FUNCTION' AS check_type,
    proname AS function_name,
    pg_get_function_identity_arguments(oid) AS arguments,
    CASE 
        WHEN proname = 'is_ride_participant' THEN '✅ Функция создана'
        ELSE '❌ Функция не найдена'
    END AS status
FROM pg_proc
WHERE proname = 'is_ride_participant';

-- Ожидаемый результат: функция должна существовать

-- 5. ИТОГОВАЯ СВОДКА
-- =============================================
SELECT 
    'SUMMARY' AS check_type,
    (SELECT COUNT(*) FROM pg_constraint 
     WHERE conrelid IN ('public.rides'::regclass, 'public.bookings'::regclass, 'public.profiles'::regclass)
     AND conname LIKE 'check_%') AS total_constraints,
    (SELECT COUNT(*) FROM pg_proc WHERE proname = 'update_seats_on_booking') AS trigger_function_exists,
    (SELECT COUNT(*) FROM pg_indexes 
     WHERE schemaname = 'public' 
     AND indexname IN ('idx_rides_status_date_active', 'idx_bookings_status_ride', 
                       'idx_messages_created_at', 'idx_profiles_rating', 'idx_rides_driver_status')) AS total_indexes,
    (SELECT COUNT(*) FROM pg_proc WHERE proname = 'is_ride_participant') AS helper_function_exists;

-- Ожидаемый результат:
-- - total_constraints: 8
-- - trigger_function_exists: 1
-- - total_indexes: 5
-- - helper_function_exists: 1

-- 6. ТЕСТОВАЯ ПРОВЕРКА РАБОТЫ CONSTRAINTS
-- =============================================
-- ВНИМАНИЕ: Эти запросы должны вызвать ошибки, что подтвердит работу constraints

-- Тест 1: Попытка создать поездку с отрицательными местами (должна быть ошибка)
-- Раскомментируйте для теста:
/*
BEGIN;
    INSERT INTO public.rides (
        driver_id, from_city, from_address, to_city, to_address,
        departure_date, departure_time, price, seats_total, seats_available
    ) VALUES (
        auth.uid(), 'Москва', 'Тест', 'СПб', 'Тест',
        CURRENT_DATE + 1, '10:00', 1000, 4, -1
    );
ROLLBACK;
-- Ожидаемый результат: ERROR: new row for relation "rides" violates check constraint "check_seats_available"
*/

-- Тест 2: Попытка создать поездку с датой в прошлом (должна быть ошибка)
-- Раскомментируйте для теста:
/*
BEGIN;
    INSERT INTO public.rides (
        driver_id, from_city, from_address, to_city, to_address,
        departure_date, departure_time, price, seats_total, seats_available
    ) VALUES (
        auth.uid(), 'Москва', 'Тест', 'СПб', 'Тест',
        CURRENT_DATE - 1, '10:00', 1000, 4, 4
    );
ROLLBACK;
-- Ожидаемый результат: ERROR: new row for relation "rides" violates check constraint "check_departure_date"
*/

-- =============================================
-- Если все проверки прошли успешно, миграция применена правильно!
-- =============================================
