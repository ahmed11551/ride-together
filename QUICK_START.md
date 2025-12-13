# 🚀 Быстрый старт Ride Together

## Шаг 1: Клонирование и установка

```bash
git clone https://github.com/ahmed11551/ride-together.git
cd ride-together
npm install
```

## Шаг 2: Создание Supabase проекта

1. Зайдите на [supabase.com](https://supabase.com) и создайте аккаунт
2. Создайте новый проект
3. Запишите:
   - Project URL (например: `https://xxxxx.supabase.co`)
   - Anon key (из Settings → API)

## Шаг 3: Настройка окружения

```bash
cp .env.example .env
```

Отредактируйте `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_MAPBOX_TOKEN=your-mapbox-token  # опционально
```

## Шаг 4: Применение миграций

В Supabase Dashboard → SQL Editor выполните:

1. `supabase/migrations/20251213021331_...sql` (основная схема)
2. `supabase/migrations/20251213021356_...sql` (исправления)
3. `supabase/migrations/20250127000000_add_reports_and_admin.sql` (админка)

## Шаг 5: Запуск

```bash
npm run dev
```

Откройте http://localhost:8080

## Шаг 6: Создание админа

В Supabase SQL Editor:
```sql
UPDATE public.profiles 
SET is_admin = true 
WHERE user_id = 'ваш-user-id';
```

## 🎉 Готово!

Теперь у вас полностью независимое приложение на Supabase!

---

**Нужна помощь?** См. [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) для детальной миграции с Lovable.

