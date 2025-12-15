# 🔄 Варианты миграции на Timeweb Cloud

## ❌ Проблема: Проект Supabase не найден

Если проект `vcjnvkdqjrqymnmqdvfr` не существует, есть несколько вариантов:

---

## ✅ Вариант 1: Найти правильный проект Supabase

1. **Открой Supabase Dashboard:**
   - https://app.supabase.com
   - Войди в аккаунт

2. **Найди проект:**
   - На главной странице список всех проектов
   - Выбери нужный проект

3. **Экспортируй данные:**
   - Database → Backups → Create backup
   - Скачай SQL файл

4. **Импортируй в Timeweb:**
   - https://dbs.timeweb.com/?pgsql=77.95.206.10&username=gen_user&db=default_db&ns=public
   - SQL Editor → Вставь backup → Выполни

---

## ✅ Вариант 2: Создать БД с нуля (если данных нет)

Если данных в Supabase нет или их мало, можно создать новую БД:

### Через веб-интерфейс Timeweb:

1. Открой: https://dbs.timeweb.com/?pgsql=77.95.206.10&username=gen_user&db=default_db&ns=public
2. SQL Editor
3. Примени миграции по порядку:
   - `supabase/migrations/20251213021331_7a00ec87-3392-4efa-8263-d4d1fe272d41.sql`
   - `supabase/migrations/20251213021356_a5c9a937-87f4-46c5-8704-a93d5b858511.sql`
   - `supabase/migrations/20250127000000_add_reports_and_admin.sql`
   - `supabase/migrations/20250128000000_add_telegram_fields.sql`
   - `supabase/migrations/20250129000000_add_subscriptions.sql`
   - `supabase/migrations/20250129000001_add_support_tickets.sql`
   - `supabase/migrations/20250130000000_cleanup_old_rides.sql`
   - `supabase/migrations/20250130000001_fix_profile_creation_trigger.sql`
   - `supabase/migrations/20250130000002_fix_security_and_performance.sql`
   - `supabase/migrations/20250131000000_improve_database_stability.sql`
   - `supabase/migrations/20250131000001_add_passenger_rating.sql`
   - `supabase/migrations/20250131000002_create_auth_tables.sql`

### Через командную строку (если установлен PostgreSQL):

```bash
export TIMEWEB_DB_PASSWORD='your-password'
./scripts/create-fresh-db-timeweb.sh
```

---

## ✅ Вариант 3: Создать новый проект Supabase

Если старого проекта нет:

1. **Создай новый проект:**
   - https://app.supabase.com → New Project
   - Выбери регион и настройки

2. **Примени миграции:**
   - SQL Editor → Примени все миграции из `supabase/migrations/`

3. **Экспортируй данные:**
   - Database → Backups → Create backup

4. **Импортируй в Timeweb:**
   - SQL Editor в Timeweb → Вставь backup

---

## 🎯 Рекомендация

**Если данных в Supabase нет или их мало:**
→ Используй **Вариант 2** (создать БД с нуля в Timeweb)

**Если данные важны:**
→ Используй **Вариант 1** (найди правильный проект)

---

## 📋 После создания БД

1. ✅ Примени миграцию Auth: `20250131000002_create_auth_tables.sql`
2. ✅ Настрой backend сервер (см. `server/`)
3. ✅ Обнови Auth систему
4. ✅ Настрой Realtime
