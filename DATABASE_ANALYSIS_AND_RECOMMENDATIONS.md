# Анализ базы данных и рекомендации по стабильности

## 📊 Текущее состояние базы данных

### ✅ Что работает хорошо

1. **Структура данных**
   - ✅ Нормализованная структура
   - ✅ Правильные foreign keys с CASCADE
   - ✅ Enum типы для статусов
   - ✅ UUID для всех ID

2. **Безопасность (RLS)**
   - ✅ Row Level Security включен для всех таблиц
   - ✅ Политики настроены правильно
   - ✅ Пользователи видят только свои данные

3. **Автоматизация**
   - ✅ Триггеры для `updated_at`
   - ✅ Триггер для создания профиля при регистрации
   - ✅ Триггер для обновления `seats_available`

4. **Производительность**
   - ✅ Индексы на ключевых полях
   - ✅ Составные индексы для частых запросов
   - ✅ Индексы для RLS политик

## ⚠️ Потенциальные проблемы и рекомендации

### 🔴 Критичные проблемы

#### 1. Race Condition в триггере `update_seats_on_booking`

**Проблема**: При одновременных бронированиях может возникнуть race condition, что приведет к неправильному подсчету мест.

**Текущий код**:
```sql
CREATE OR REPLACE FUNCTION public.update_seats_on_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.rides 
        SET seats_available = seats_available - NEW.seats_booked
        WHERE id = NEW.ride_id;
    ...
END;
```

**Рекомендация**: Использовать `SELECT FOR UPDATE` для блокировки строки:
```sql
CREATE OR REPLACE FUNCTION public.update_seats_on_booking()
RETURNS TRIGGER AS $$
DECLARE
    current_seats INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Блокируем строку для обновления
        SELECT seats_available INTO current_seats
        FROM public.rides
        WHERE id = NEW.ride_id
        FOR UPDATE;
        
        -- Проверяем доступность мест
        IF current_seats < NEW.seats_booked THEN
            RAISE EXCEPTION 'Недостаточно свободных мест. Доступно: %, запрошено: %', 
                current_seats, NEW.seats_booked;
        END IF;
        
        UPDATE public.rides 
        SET seats_available = seats_available - NEW.seats_booked
        WHERE id = NEW.ride_id;
    ...
END;
```

#### 2. Отсутствие CHECK constraints

**Проблема**: Нет проверки на уровне БД для:
- `seats_available >= 0`
- `seats_available <= seats_total`
- `seats_booked > 0`
- `price > 0`

**Рекомендация**: Добавить CHECK constraints:
```sql
-- Для rides
ALTER TABLE public.rides
ADD CONSTRAINT check_seats_available 
    CHECK (seats_available >= 0 AND seats_available <= seats_total);

ALTER TABLE public.rides
ADD CONSTRAINT check_seats_total 
    CHECK (seats_total > 0 AND seats_total <= 10);

ALTER TABLE public.rides
ADD CONSTRAINT check_price 
    CHECK (price >= 0 AND price <= 1000000);

-- Для bookings
ALTER TABLE public.bookings
ADD CONSTRAINT check_seats_booked 
    CHECK (seats_booked > 0 AND seats_booked <= 10);

ALTER TABLE public.bookings
ADD CONSTRAINT check_total_price 
    CHECK (total_price >= 0);
```

#### 3. Нет защиты от двойного бронирования

**Проблема**: UNIQUE(ride_id, passenger_id) предотвращает повторное бронирование, но не защищает от одновременных запросов.

**Рекомендация**: Использовать advisory locks или проверку в триггере:
```sql
-- В триггере перед INSERT
IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE ride_id = NEW.ride_id 
    AND passenger_id = NEW.passenger_id
    AND status != 'cancelled'
) THEN
    RAISE EXCEPTION 'Бронирование уже существует';
END IF;
```

### 🟡 Важные улучшения

#### 4. Оптимизация RLS политик для messages

**Проблема**: Политики используют подзапросы, что может быть медленно:
```sql
USING (
    auth.uid() IN (SELECT driver_id FROM public.rides WHERE id = ride_id) OR
    auth.uid() IN (SELECT passenger_id FROM public.bookings WHERE ride_id = messages.ride_id)
);
```

**Рекомендация**: Использовать JOIN или создать материализованное представление:
```sql
-- Создать функцию для проверки участия
CREATE OR REPLACE FUNCTION public.is_ride_participant(
    p_ride_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.rides WHERE id = p_ride_id AND driver_id = p_user_id
    ) OR EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE ride_id = p_ride_id AND passenger_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Использовать в политике
CREATE POLICY "messages_select_policy"
ON public.messages FOR SELECT
USING (public.is_ride_participant(ride_id, auth.uid()));
```

#### 5. Валидация на уровне БД

**Проблема**: Валидация только на уровне приложения. Если приложение обойдет валидацию, данные могут быть некорректными.

**Рекомендация**: Добавить CHECK constraints:
```sql
-- Проверка даты поездки
ALTER TABLE public.rides
ADD CONSTRAINT check_departure_date 
    CHECK (departure_date >= CURRENT_DATE);

-- Проверка рейтинга
ALTER TABLE public.profiles
ADD CONSTRAINT check_rating 
    CHECK (rating >= 0 AND rating <= 5);

-- Проверка количества поездок
ALTER TABLE public.profiles
ADD CONSTRAINT check_trips_count 
    CHECK (trips_count >= 0);
```

#### 6. Отсутствие индексов для частых запросов

**Рекомендация**: Добавить индексы:
```sql
-- Для поиска поездок по статусу и дате
CREATE INDEX IF NOT EXISTS idx_rides_status_date 
ON public.rides(status, departure_date) 
WHERE status = 'active';

-- Для поиска активных бронирований
CREATE INDEX IF NOT EXISTS idx_bookings_status_ride 
ON public.bookings(status, ride_id) 
WHERE status IN ('pending', 'confirmed');

-- Для поиска сообщений по времени
CREATE INDEX IF NOT EXISTS idx_messages_created_at 
ON public.messages(ride_id, created_at DESC);
```

### 🟢 Улучшения производительности

#### 7. Партиционирование для больших таблиц

**Рекомендация**: Если таблицы станут большими (>1M записей), рассмотреть партиционирование:
```sql
-- Пример для messages по дате
CREATE TABLE public.messages_2025_01 
PARTITION OF public.messages
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

#### 8. Материализованные представления для аналитики

**Рекомендация**: Для часто используемых агрегаций:
```sql
CREATE MATERIALIZED VIEW public.ride_statistics AS
SELECT 
    driver_id,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_rides,
    AVG(price) as avg_price,
    SUM(seats_total - seats_available) as total_passengers
FROM public.rides
GROUP BY driver_id;

CREATE UNIQUE INDEX ON public.ride_statistics(driver_id);

-- Обновлять периодически или через триггер
```

#### 9. Мониторинг и логирование

**Рекомендация**: Добавить логирование важных операций:
```sql
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id UUID,
    user_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_audit_log_table_created 
ON public.audit_log(table_name, created_at DESC);
```

## 📋 План действий по приоритетам

### Приоритет 1 (Критично - сделать немедленно)
1. ✅ Добавить CHECK constraints для seats и price
2. ✅ Исправить race condition в триггере бронирований
3. ✅ Добавить проверку доступности мест перед бронированием

### Приоритет 2 (Важно - сделать в ближайшее время)
4. ⏳ Оптимизировать RLS политики для messages
5. ⏳ Добавить недостающие индексы
6. ⏳ Добавить валидацию дат на уровне БД

### Приоритет 3 (Улучшения - можно сделать позже)
7. ⏳ Настроить мониторинг и логирование
8. ⏳ Рассмотреть партиционирование при росте данных
9. ⏳ Создать материализованные представления для аналитики

## 🔍 Проверка стабильности

### Текущие метрики
- ✅ **RLS**: Настроен правильно
- ✅ **Триггеры**: Работают
- ⚠️ **Constraints**: Недостаточно
- ✅ **Индексы**: Хорошее покрытие
- ⚠️ **Race conditions**: Возможны

### Рекомендуемые проверки
1. Нагрузочное тестирование бронирований
2. Проверка целостности данных
3. Мониторинг медленных запросов
4. Проверка использования индексов

## 📝 SQL миграция для критичных исправлений

Создайте файл `20250131000000_improve_stability.sql`:

```sql
-- 1. Добавляем CHECK constraints
ALTER TABLE public.rides
ADD CONSTRAINT check_seats_available 
    CHECK (seats_available >= 0 AND seats_available <= seats_total);

ALTER TABLE public.rides
ADD CONSTRAINT check_seats_total 
    CHECK (seats_total > 0 AND seats_total <= 10);

ALTER TABLE public.rides
ADD CONSTRAINT check_price 
    CHECK (price >= 0 AND price <= 1000000);

ALTER TABLE public.rides
ADD CONSTRAINT check_departure_date 
    CHECK (departure_date >= CURRENT_DATE);

ALTER TABLE public.bookings
ADD CONSTRAINT check_seats_booked 
    CHECK (seats_booked > 0 AND seats_booked <= 10);

ALTER TABLE public.bookings
ADD CONSTRAINT check_total_price 
    CHECK (total_price >= 0);

ALTER TABLE public.profiles
ADD CONSTRAINT check_rating 
    CHECK (rating >= 0 AND rating <= 5);

ALTER TABLE public.profiles
ADD CONSTRAINT check_trips_count 
    CHECK (trips_count >= 0);

-- 2. Улучшаем триггер бронирований
CREATE OR REPLACE FUNCTION public.update_seats_on_booking()
RETURNS TRIGGER AS $$
DECLARE
    current_seats INTEGER;
    ride_status TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Блокируем строку и проверяем доступность
        SELECT seats_available, status INTO current_seats, ride_status
        FROM public.rides
        WHERE id = NEW.ride_id
        FOR UPDATE;
        
        -- Проверяем статус поездки
        IF ride_status != 'active' THEN
            RAISE EXCEPTION 'Поездка не активна';
        END IF;
        
        -- Проверяем доступность мест
        IF current_seats < NEW.seats_booked THEN
            RAISE EXCEPTION 'Недостаточно свободных мест. Доступно: %, запрошено: %', 
                current_seats, NEW.seats_booked;
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
            -- Места уже заняты, ничего не делаем
            NULL;
        ELSIF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
            -- Возвращаем места
            UPDATE public.rides 
            SET seats_available = seats_available + OLD.seats_booked
            WHERE id = OLD.ride_id;
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Возвращаем места при удалении
        UPDATE public.rides 
        SET seats_available = seats_available + OLD.seats_booked
        WHERE id = OLD.ride_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Добавляем недостающие индексы
CREATE INDEX IF NOT EXISTS idx_rides_status_date_active 
ON public.rides(status, departure_date) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_bookings_status_ride 
ON public.bookings(status, ride_id) 
WHERE status IN ('pending', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_messages_created_at 
ON public.messages(ride_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_rating 
ON public.profiles(rating) 
WHERE rating IS NOT NULL;
```

## ✅ Итоговая оценка стабильности

### Текущая стабильность: 🟡 **Хорошая, но есть риски**

**Сильные стороны**:
- ✅ Правильная структура
- ✅ RLS настроен
- ✅ Индексы есть
- ✅ Триггеры работают

**Слабые стороны**:
- ⚠️ Возможны race conditions
- ⚠️ Недостаточно constraints
- ⚠️ Нет защиты от некорректных данных на уровне БД

**После применения рекомендаций**: 🟢 **Отличная стабильность**
