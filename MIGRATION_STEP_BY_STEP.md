# 🔄 Пошаговая миграция на Timeweb Cloud

## 📋 План выполнения (по порядку)

---

## ФАЗА 1: Подготовка БД (1-2 часа)

### Шаг 1: Создание БД в Timeweb Cloud

1. Откройте: https://timeweb.cloud/my/projects/2005839
2. Перейдите в **Databases** → **Create Database**
3. Выберите **PostgreSQL**
4. Конфигурация:
   - **Минимум:** 1 ГБ RAM, 1 ГБ Storage
   - **Рекомендуется:** 2 ГБ RAM, 5 ГБ Storage
5. Запишите данные подключения:
   ```
   Host: xxx.timeweb.cloud
   Port: 5432
   Database: your_database_name
   Username: your_username
   Password: your_password
   ```

### Шаг 2: Экспорт данных из Supabase

**Способ A: Через Supabase Dashboard (Проще)**

1. Supabase Dashboard → Database → Backups
2. Нажмите "Create backup"
3. Дождитесь завершения
4. Скачайте SQL файл

**Способ B: Через pg_dump (Точнее)**

```bash
# Установите PostgreSQL клиент (если нет)
brew install postgresql  # macOS

# Получите пароль из Supabase Dashboard
# Settings → Database → Connection string → Password

# Экспорт
pg_dump -h db.vcjnvkdqjrqymnmqdvfr.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  --schema=public \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  -F p \
  > supabase_backup_$(date +%Y%m%d_%H%M%S).sql
```

**Или используйте готовый скрипт:**
```bash
cd /Users/ahmeddevops/Desktop/ride/ride-together
chmod +x scripts/export-supabase-data.sh
./scripts/export-supabase-data.sh
```

### Шаг 3: Импорт в Timeweb Cloud

**Способ A: Через панель Timeweb**

1. Databases → Ваша БД → SQL Editor
2. Откройте backup файл
3. Скопируйте содержимое
4. Вставьте в SQL Editor
5. Выполните

**Способ B: Через psql**

```bash
# Импорт
psql -h your-timeweb-host \
  -p 5432 \
  -U your-username \
  -d your-database \
  < supabase_backup.sql
```

**Или используйте готовый скрипт:**
```bash
./scripts/import-to-timeweb.sh supabase_backup.sql
```

### Шаг 4: Применение миграций

Примените миграции в порядке:

1. `20251213021331_7a00ec87-3392-4efa-8263-d4d1fe272d41.sql` (основная схема)
2. `20251213021356_a5c9a937-87f4-46c5-8704-a93d5b858511.sql`
3. `20250127000000_add_reports_and_admin.sql`
4. `20250128000000_add_telegram_fields.sql`
5. `20250129000000_add_subscriptions.sql`
6. `20250129000001_add_support_tickets.sql`
7. `20250130000000_cleanup_old_rides.sql`
8. `20250130000001_fix_profile_creation_trigger.sql`
9. `20250130000002_fix_security_and_performance.sql`
10. `20250131000000_improve_database_stability.sql`
11. `20250131000001_add_passenger_rating.sql`

**Важно:** Некоторые миграции могут конфликтовать, так как данные уже импортированы. Нужно будет адаптировать.

---

## ФАЗА 2: Замена Auth системы (4-6 часов)

### Шаг 5: Создание таблиц для Auth

Создайте миграцию для новой Auth системы:

```sql
-- Таблица пользователей (замена auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Таблица сессий
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_token ON public.sessions(token);
CREATE INDEX idx_sessions_expires_at ON public.sessions(expires_at);

-- Миграция данных из auth.users
INSERT INTO public.users (id, email, email_verified, created_at)
SELECT id, email, email_confirmed_at IS NOT NULL, created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Обновить profiles для связи с новой таблицей users
-- (если profiles.user_id ссылается на auth.users, нужно обновить)
```

### Шаг 6: Создание API для Auth

Создайте backend сервер или используйте Timeweb Cloud Functions.

**Структура API:**
- `POST /api/auth/signup` - Регистрация
- `POST /api/auth/signin` - Вход
- `POST /api/auth/signout` - Выход
- `GET /api/auth/me` - Текущий пользователь
- `POST /api/auth/refresh` - Обновление токена

---

## ФАЗА 3: Замена Realtime (3-4 часа)

### Шаг 7: Настройка WebSocket сервера

Используйте Socket.io или другой WebSocket библиотеку.

---

## ФАЗА 4: Перенос Edge Functions (2-3 часа)

### Шаг 8: Перенос Telegram бота

Telegram бот нужно переписать с Deno на Node.js и задеплоить отдельно.

---

## ⚠️ ВАЖНО: Начнем с первого шага

**Сейчас начнем с:**
1. Создания БД в Timeweb Cloud
2. Экспорта данных из Supabase

**Готовы начать?** Скажите, когда создадите БД в Timeweb, и я помогу с экспортом данных!
