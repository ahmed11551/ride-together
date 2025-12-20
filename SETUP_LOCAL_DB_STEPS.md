# Настройка локальной базы данных на сервере

## Шаг 1: Загрузите схему на сервер

На вашем Mac:
```bash
cd /Users/ahmeddevops/Desktop/ride/ride-together
scp TIMEWEB_FULL_SCHEMA.sql root@194.67.124.123:/var/www/ride-together/
```

## Шаг 2: Выполните скрипт на сервере

На сервере:
```bash
# Загрузите скрипт (или выполните команды вручную)
cd /var/www/ride-together/server

# Создание БД и пользователя
sudo -u postgres psql << 'SQL'
CREATE USER ride_user WITH PASSWORD 'ride_password_secure_change_in_production';
ALTER USER ride_user CREATEDB;
CREATE DATABASE ride_together OWNER ride_user;
GRANT ALL PRIVILEGES ON DATABASE ride_together TO ride_user;
\q
SQL

# Применение схемы
sudo -u postgres psql -d ride_together -f /var/www/ride-together/TIMEWEB_FULL_SCHEMA.sql

# Права
sudo -u postgres psql -d ride_together << 'SQL'
GRANT ALL ON SCHEMA public TO ride_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ride_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ride_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ride_user;
\q
SQL

# Обновление DATABASE_URL в ecosystem.config.cjs
sed -i "s|DATABASE_URL: '[^']*'|DATABASE_URL: 'postgresql://ride_user:ride_password_secure_change_in_production@localhost:5432/ride_together'|g" ecosystem.config.cjs

# Перезапуск PM2
pm2 restart ride-backend --update-env

# Проверка
sleep 3
curl -s "http://localhost:3001/api/rides?limit=1" | head -c 200
```

