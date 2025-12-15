# 🚀 Быстрое подключение к Timeweb Cloud Database

## ✅ Данные подключения

```
Host: 9d497bc2bf9dd679bd9834af.twc1.net
Port: 5432
Database: default_db
Username: gen_user
Password: [ваш пароль]
SSL: ca.crt (уже в проекте)
```

## 📋 Шаг 1: Подключение

```bash
# Установите пароль
export TIMEWEB_DB_PASSWORD='your-password'

# Подключитесь
./scripts/connect-timeweb.sh
```

## 📋 Шаг 2: Экспорт данных из Supabase

```bash
# Установите пароль Supabase
export SUPABASE_DB_PASSWORD='supabase-password'

# Экспортируйте
./scripts/export-supabase-data.sh
```

## 📋 Шаг 3: Импорт в Timeweb

```bash
# Импортируйте (используйте имя файла из шага 2)
./scripts/import-to-timeweb.sh supabase_backup_YYYYMMDD_HHMMSS.sql
```

## 📋 Шаг 4: Применение миграций

После импорта данных примените миграции через SQL Editor в Timeweb или через psql:

```bash
# Подключитесь
./scripts/connect-timeweb.sh

# В psql выполните:
\i supabase/migrations/20250131000002_create_auth_tables.sql
```

## ⚙️ Настройка для разработки

Создайте `.env.timeweb`:

```bash
cp env.timeweb.example .env.timeweb
# Отредактируйте .env.timeweb
```

## 🔧 Проверка

```bash
# Проверка подключения
./scripts/connect-timeweb.sh

# В psql проверьте таблицы:
\dt
```

## ✅ Готово!

Теперь можно:
1. Настроить backend сервер (см. `server/`)
2. Обновить Auth систему
3. Настроить Realtime
