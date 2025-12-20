# ⚡ Быстрая установка улучшений на сервере

## Автоматическая установка (рекомендуется)

```bash
# 1. Подключитесь к серверу
ssh root@194.67.124.123

# 2. Перейдите в директорию проекта
cd /var/www/ride-together/server

# 3. Скопируйте скрипт на сервер (если его нет)
# Или создайте его вручную через nano/vim

# 4. Запустите скрипт установки
chmod +x INSTALL_IMPROVEMENTS.sh
./INSTALL_IMPROVEMENTS.sh
```

---

## Ручная установка (по шагам)

### 1. Установка зависимостей
```bash
cd /var/www/ride-together/server
npm install @sentry/node nodemailer
npm install --save-dev @types/nodemailer
```

### 2. Пересборка
```bash
npm run build
```

### 3. Миграции БД
```bash
psql -U ride_user -d ride_together -f migrations/add_notifications_table.sql
psql -U ride_user -d ride_together -f migrations/add_saved_searches_table.sql
psql -U ride_user -d ride_together -f migrations/add_location_tables.sql
```

### 4. Обновите ecosystem.config.cjs
Добавьте переменные окружения (см. SERVER_SETUP_GUIDE.md)

### 5. Перезапуск
```bash
pm2 restart ride-backend --update-env
pm2 logs ride-backend
```

---

## Минимальная настройка переменных окружения

Минимум, что нужно добавить в `ecosystem.config.cjs`:

```javascript
env: {
  // ... существующие ...
  LOG_LEVEL: 'info',
  GEOCODING_PROVIDER: 'nominatim', // Бесплатный провайдер
}
```

Email можно настроить позже, если не нужен сразу.

---

## Проверка после установки

```bash
# Статус PM2
pm2 status

# Health check
curl http://localhost:3001/health

# Логи
pm2 logs ride-backend --lines 20
```

Готово! 🎉

