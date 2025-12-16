# Деплой: Фронтенд на Vercel, Бэкенд на Timeweb

## Архитектура

- **Фронтенд**: Vercel (React + Vite)
- **Бэкенд**: Timeweb Cloud (Node.js/Express + PostgreSQL)
- **База данных**: PostgreSQL на Timeweb Cloud

## Шаг 1: Настройка базы данных на Timeweb

1. Перейдите в [Timeweb Cloud](https://timeweb.cloud/my/projects/2005839)
2. Откройте ваш проект и создайте PostgreSQL базу данных
3. Примените схему БД:
   - Откройте SQL Editor в Timeweb
   - Скопируйте содержимое файла `TIMEWEB_FULL_SCHEMA.sql`
   - Выполните скрипт

## Шаг 2: Настройка бэкенда на Timeweb

### 2.1 Подготовка бэкенда

1. Перейдите в папку `server`:
   ```bash
   cd server
   ```

2. Установите зависимости:
   ```bash
   npm install
   ```

3. Создайте файл `.env` в папке `server`:
   ```env
   # Database
   TIMEWEB_DB_HOST=your-timeweb-db-host.twc1.net
   TIMEWEB_DB_PORT=5432
   TIMEWEB_DB_NAME=default_db
   TIMEWEB_DB_USER=gen_user
   TIMEWEB_DB_PASSWORD=your-password
   TIMEWEB_DB_SSL=true
   TIMEWEB_DB_SSL_CERT=./ca.crt
   TIMEWEB_DB_SSL_MODE=verify-full

   # Server
   PORT=3001
   NODE_ENV=production

   # JWT
   JWT_SECRET=your-very-secret-jwt-key-min-32-chars
   JWT_EXPIRES_IN=7d

   # CORS (замените на ваш Vercel домен после деплоя)
   ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.your-app.vercel.app

   # WebSocket
   WS_PORT=3001
   ```

4. Скопируйте `ca.crt` в папку `server` (SSL сертификат для Timeweb DB)

### 2.2 Сборка и деплой бэкенда на Timeweb

#### Вариант A: Деплой через Timeweb App Platform

1. В Timeweb Cloud создайте новое приложение (App Platform)
2. Подключите GitHub репозиторий
3. Настройки:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**: Скопируйте все переменные из `.env`
   - **Port**: `3001`

#### Вариант B: Деплой через Docker

1. Создайте `server/Dockerfile`:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3001
   CMD ["npm", "start"]
   ```

2. Создайте `server/.dockerignore`:
   ```
   node_modules
   dist
   .env
   ```

3. Деплой через Timeweb Container Platform

### 2.3 Получение URL бэкенда

После деплоя запишите URL вашего бэкенда:
- Пример: `https://api.your-app.twc1.net` или `https://your-backend-app.twc1.net`

## Шаг 3: Деплой фронтенда на Vercel

### 3.1 Настройка переменных окружения в Vercel

1. Перейдите в [Vercel Dashboard](https://vercel.com)
2. Откройте ваш проект (или создайте новый)
3. Перейдите в **Settings** → **Environment Variables**
4. Добавьте следующие переменные:

```env
# Backend API (ОБЯЗАТЕЛЬНО)
VITE_API_URL=https://your-backend-url.twc1.net

# WebSocket (опционально, если отличается от API_URL)
VITE_WS_URL=wss://your-backend-url.twc1.net

# Яндекс.Карты (опционально)
VITE_YANDEX_MAPS_API_KEY=your-yandex-maps-key

# Telegram Bot (опционально)
VITE_TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Monitoring (опционально)
VITE_SENTRY_DSN=your-sentry-dsn
VITE_GA_MEASUREMENT_ID=your-ga-id
```

### 3.2 Подключение GitHub репозитория

1. В Vercel Dashboard нажмите **Add New Project**
2. Импортируйте ваш GitHub репозиторий
3. Настройки сборки:
   - **Framework Preset**: Vite
   - **Root Directory**: `ride-together` (или оставьте пустым, если репозиторий корневой)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Важно**: После деплоя запомните ваш Vercel домен (например: `your-app.vercel.app`)

### 3.3 Обновление CORS на бэкенде

1. После получения Vercel домена, обновите `ALLOWED_ORIGINS` в `.env` бэкенда:
   ```env
   ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.your-app.vercel.app
   ```

2. Перезапустите бэкенд приложение на Timeweb

## Шаг 4: Проверка работы

### 4.1 Проверка бэкенда

```bash
# Health check
curl https://your-backend-url.twc1.net/health

# Должен вернуть: {"status":"ok","timestamp":"..."}
```

### 4.2 Проверка фронтенда

1. Откройте ваш Vercel домен
2. Проверьте консоль браузера (F12) на наличие ошибок
3. Попробуйте зарегистрироваться/войти

### 4.3 Проверка WebSocket

1. Откройте DevTools → Network → WS
2. Проверьте подключение к WebSocket серверу
3. Должно быть активное подключение без ошибок

## Шаг 5: Настройка домена (опционально)

### Для фронтенда (Vercel)

1. В Vercel Dashboard → Settings → Domains
2. Добавьте ваш кастомный домен
3. Следуйте инструкциям по настройке DNS

### Для бэкенда (Timeweb)

1. В Timeweb Cloud → DNS
2. Создайте A-запись или CNAME для поддомена API
3. Настройте в Timeweb App Platform

**Важно**: После изменения доменов обновите:
- `VITE_API_URL` в Vercel
- `ALLOWED_ORIGINS` в Timeweb бэкенде

## Troubleshooting

### Ошибка CORS

**Проблема**: `Access-Control-Allow-Origin` ошибка

**Решение**:
1. Проверьте `ALLOWED_ORIGINS` в `.env` бэкенда
2. Убедитесь, что домен Vercel добавлен точно (с https://)
3. Перезапустите бэкенд

### Ошибка подключения к БД

**Проблема**: `Connection refused` или SSL ошибка

**Решение**:
1. Проверьте доступность `ca.crt` в папке `server`
2. Проверьте `TIMEWEB_DB_SSL=true` и `TIMEWEB_DB_SSL_MODE=verify-full`
3. Проверьте правильность хоста, порта, имени БД, пользователя и пароля

### Ошибка аутентификации

**Проблема**: `401 Unauthorized` или токен не работает

**Решение**:
1. Проверьте `JWT_SECRET` (должен быть одинаковым на всех серверах)
2. Проверьте, что токен сохраняется в localStorage
3. Проверьте заголовок `Authorization: Bearer <token>` в Network tab

### WebSocket не подключается

**Проблема**: WebSocket connection failed

**Решение**:
1. Проверьте `VITE_WS_URL` (должен начинаться с `ws://` или `wss://`)
2. Проверьте, что WebSocket сервер запущен на бэкенде
3. Проверьте файрвол Timeweb (порт должен быть открыт)

## Полезные команды

### Локальная разработка фронтенда

```bash
# Создайте .env в корне проекта
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

npm run dev
```

### Локальная разработка бэкенда

```bash
cd server
npm run dev
```

### Проверка сборки

```bash
# Фронтенд
npm run build
npm run preview

# Бэкенд
cd server
npm run build
npm start
```

## Структура файлов после деплоя

```
ride-together/
├── server/                    # Бэкенд (Timeweb)
│   ├── .env                  # Переменные окружения (НЕ коммитить!)
│   ├── ca.crt                # SSL сертификат Timeweb
│   ├── dist/                 # Собранный код
│   └── ...
├── src/                      # Фронтенд (Vercel)
├── dist/                     # Собранный фронтенд
└── vercel.json               # Конфигурация Vercel
```

## Важные замечания

1. **Не коммитьте `.env` файлы** - они должны быть только на серверах
2. **Обновите `ALLOWED_ORIGINS`** после каждого изменения домена
3. **Используйте HTTPS/WSS** в production
4. **Храните `JWT_SECRET` в безопасности** - используйте случайную строку длиной минимум 32 символа
5. **Регулярно обновляйте зависимости** для безопасности

## Поддержка

При возникновении проблем:
1. Проверьте логи в Vercel Dashboard (Deployments → View Function Logs)
2. Проверьте логи в Timeweb Cloud (App Platform → Logs)
3. Проверьте консоль браузера (F12 → Console)
