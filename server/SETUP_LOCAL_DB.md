# 🗄️ Настройка локальной PostgreSQL базы данных

## Быстрая настройка:

```bash
cd /var/www/ride-together/server
chmod +x setup-local-db.sh
./setup-local-db.sh
```

## Или вручную:

### 1. Установить PostgreSQL (если не установлен):

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Создать базу данных и пользователя:

```bash
# Переключаемся на пользователя postgres
sudo -u postgres psql

# В psql выполните:
CREATE USER ride_user WITH PASSWORD 'ваш_надежный_пароль';
CREATE DATABASE ride_together OWNER ride_user;
GRANT ALL PRIVILEGES ON DATABASE ride_together TO ride_user;
\c ride_together
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
\q
```

### 3. Обновить ecosystem.config.cjs:

Замените `DATABASE_URL` на:
```javascript
DATABASE_URL: 'postgresql://ride_user:ваш_пароль@localhost:5432/ride_together'
```

### 4. Применить схему базы данных:

```bash
# Вариант 1: Если есть полная схема
psql postgresql://ride_user:пароль@localhost:5432/ride_together < TIMEWEB_FULL_SCHEMA.sql

# Вариант 2: Применить миграции по порядку
psql postgresql://ride_user:пароль@localhost:5432/ride_together < migrations/add_notifications_table.sql
psql postgresql://ride_user:пароль@localhost:5432/ride_together < migrations/add_saved_searches_table.sql
psql postgresql://ride_user:пароль@localhost:5432/ride_together < migrations/add_location_tables.sql
```

### 5. Перезапустить PM2:

```bash
pm2 restart ride-backend --update-env
pm2 logs ride-backend --lines 20
```

---

## Проверка подключения:

```bash
# Проверить подключение
psql postgresql://ride_user:пароль@localhost:5432/ride_together -c "SELECT version();"

# Проверить таблицы
psql postgresql://ride_user:пароль@localhost:5432/ride_together -c "\dt"
```

---

## Безопасность:

⚠️ **Важно:** Не храните пароль в открытом виде в ecosystem.config.cjs!

Лучше использовать переменные окружения или файл .env:

```bash
# Создать .env.production
echo "DATABASE_URL=postgresql://ride_user:пароль@localhost:5432/ride_together" > .env.production
chmod 600 .env.production
```

И удалить из ecosystem.config.cjs, сервер загрузит из .env файла.

