# 🚀 Следующие шаги миграции

## ✅ Что уже создано

1. ✅ **Скрипты экспорта/импорта** - готовы к использованию
2. ✅ **Миграция Auth таблиц** - `20250131000002_create_auth_tables.sql`
3. ✅ **Backend сервер** - структура создана
4. ✅ **API endpoints** - signup, signin, signout, me
5. ✅ **WebSocket сервер** - для Realtime
6. ✅ **Утилиты** - JWT, database, profile

---

## 📋 Что делать сейчас

### ШАГ 1: Создать БД в Timeweb Cloud ⏳

1. Откройте: https://timeweb.cloud/my/projects/2005839
2. Databases → Create Database → PostgreSQL
3. Сохраните данные подключения

**Сообщите мне, когда БД создана!**

---

### ШАГ 2: Экспортировать данные из Supabase

**Простой способ (рекомендуется):**
1. Supabase Dashboard → Database → Backups
2. Create backup
3. Скачайте SQL файл

**Или через скрипт:**
```bash
# Получите пароль из Supabase Dashboard
# Settings → Database → Connection string → Reveal password

export SUPABASE_DB_PASSWORD='your-password'
./scripts/export-supabase-data.sh
```

---

### ШАГ 3: Импортировать в Timeweb Cloud

После создания БД и экспорта данных:

**Через панель Timeweb:**
1. Databases → Ваша БД → SQL Editor
2. Вставьте содержимое backup файла
3. Выполните

**Или через скрипт:**
```bash
./scripts/import-to-timeweb.sh supabase_backup.sql
```

---

## 🔧 После импорта данных

### ШАГ 4: Применить миграцию Auth таблиц

```sql
-- В Timeweb Cloud SQL Editor
-- Выполните: supabase/migrations/20250131000002_create_auth_tables.sql
```

### ШАГ 5: Установить зависимости для backend

```bash
cd server
npm install
```

### ШАГ 6: Настроить переменные окружения

Создайте `server/.env`:
```env
# Database
TIMEWEB_DB_HOST=xxx.timeweb.cloud
TIMEWEB_DB_PORT=5432
TIMEWEB_DB_NAME=your_database
TIMEWEB_DB_USER=your_username
TIMEWEB_DB_PASSWORD=your_password
TIMEWEB_DB_SSL=false

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this

# Server
PORT=3001
ALLOWED_ORIGINS=https://your-app.timeweb.cloud,http://localhost:8080
```

---

## 📊 Прогресс

- [ ] БД создана в Timeweb Cloud
- [ ] Данные экспортированы из Supabase
- [ ] Данные импортированы в Timeweb
- [ ] Миграция Auth таблиц применена
- [ ] Backend сервер настроен
- [ ] API endpoints работают
- [ ] WebSocket сервер работает
- [ ] AuthContext обновлен
- [ ] Realtime обновлен
- [ ] Telegram бот перенесен
- [ ] Все протестировано

---

## ⏳ Время выполнения

- **Фаза 1 (БД):** 1-2 часа
- **Фаза 2 (Auth):** 4-6 часов
- **Фаза 3 (Realtime):** 3-4 часа
- **Фаза 4 (Edge Functions):** 2-3 часа
- **Фаза 5 (Тестирование):** 2-3 часа

**Общее время:** 2-3 дня работы

---

## 🎯 Начнем с первого шага!

**Создайте БД в Timeweb Cloud и сообщите мне - продолжу с экспортом данных!** 🚀
