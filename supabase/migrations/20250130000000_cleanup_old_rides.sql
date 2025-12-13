-- Функция для очистки старых отмененных и завершенных поездок
-- Удаляет поездки, которые были отменены или завершены более 30 дней назад

CREATE OR REPLACE FUNCTION cleanup_old_rides()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  deleted_rides INTEGER;
BEGIN
  -- Удаляем отмененные поездки старше 30 дней
  -- И завершенные поездки старше 30 дней
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем функцию для ручной очистки (для использования в приложении)
CREATE OR REPLACE FUNCTION cleanup_user_old_rides(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Удаляем только поездки пользователя, которые были отменены или завершены более 30 дней назад
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем индексы для оптимизации запросов очистки
CREATE INDEX IF NOT EXISTS idx_rides_status_updated_at ON public.rides(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_rides_driver_status_updated_at ON public.rides(driver_id, status, updated_at);

-- Комментарии
COMMENT ON FUNCTION cleanup_old_rides() IS 'Удаляет отмененные и завершенные поездки старше 30 дней';
COMMENT ON FUNCTION cleanup_user_old_rides(UUID) IS 'Удаляет старые поездки конкретного пользователя';

