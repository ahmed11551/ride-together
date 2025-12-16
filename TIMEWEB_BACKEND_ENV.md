# 🔧 Environment Variables для Backend на Timeweb

## Обязательные переменные

### Database Connection

```bash
DATABASE_URL=postgresql://gen_user:fn)un5%40K2oLrBJ@9d497bc2bf9dd679bd9834af.twc1.net:5432/default_db?sslmode=verify-full
```

**ИЛИ** отдельные переменные:

```bash
TIMEWEB_DB_HOST=9d497bc2bf9dd679bd9834af.twc1.net
TIMEWEB_DB_PORT=5432
TIMEWEB_DB_NAME=default_db
TIMEWEB_DB_USER=gen_user
TIMEWEB_DB_PASSWORD=fn)un5%40K2oLrBJ
TIMEWEB_DB_SSL=true
TIMEWEB_DB_SSL_MODE=verify-full
```

### SSL Certificate (если требуется)

```bash
PGSSLROOTCERT=/path/to/root.crt
```

Или через переменную:
```bash
TIMEWEB_DB_SSL_CERT=./ca.crt
```

### JWT Secret

```bash
JWT_SECRET=your-very-secret-jwt-key-min-32-chars-change-this
```

**ВАЖНО:** Используйте случайную строку минимум 32 символа:
```bash
openssl rand -base64 32
```

### CORS Configuration

```bash
ALLOWED_ORIGINS=https://your-frontend-domain.twc1.net,https://www.your-frontend-domain.twc1.net
FRONTEND_URL=https://your-frontend-domain.twc1.net
```

## Полный список переменных

```bash
# Database
DATABASE_URL=postgresql://gen_user:fn)un5%40K2oLrBJ@9d497bc2bf9dd679bd9834af.twc1.net:5432/default_db?sslmode=verify-full
PGSSLROOTCERT=/path/to/root.crt

# Server
PORT=3001
NODE_ENV=production

# JWT
JWT_SECRET=your-very-secret-jwt-key-min-32-chars-change-this
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=https://your-frontend-domain.twc1.net
FRONTEND_URL=https://your-frontend-domain.twc1.net
```

## Как добавить в Timeweb

1. Откройте **Timeweb Dashboard**
2. Перейдите в ваш **Backend App**
3. Откройте **Environment Variables**
4. Добавьте все переменные из списка выше
5. Сохраните и перезапустите приложение

## Проверка подключения

После добавления переменных, проверьте подключение:

1. Backend должен запуститься без ошибок
2. Проверьте `/health` endpoint
3. Проверьте логи на наличие ошибок подключения к БД

## Применение миграций

После настройки подключения, примените схему БД:

1. Откройте **SQL Editor** в Timeweb Dashboard
2. Скопируйте содержимое `TIMEWEB_FULL_SCHEMA.sql`
3. Выполните SQL скрипт
4. Проверьте, что все таблицы созданы
