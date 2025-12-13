-- Исправляем функцию создания профиля при регистрации пользователя
-- Убеждаемся, что profiles.id = user.id для соблюдения foreign key constraint

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Создаем профиль с id = user.id для соблюдения foreign key constraint
    INSERT INTO public.profiles (
        id,
        user_id, 
        display_name,
        full_name,
        email
    )
    VALUES (
        NEW.id, -- profiles.id должен быть равен user.id
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email, 'Пользователь'),
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.email
    )
    ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        email = COALESCE(EXCLUDED.email, profiles.email),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

