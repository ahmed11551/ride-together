# 🚀 Полный деплой на Timeweb: Фронтенд + Бэкенд

## Архитектура

- **Фронтенд**: Timeweb Static Hosting (или App Platform)
- **Бэкенд**: Timeweb App Platform (Node.js/Express)
- **База данных**: PostgreSQL на Timeweb Cloud

## Шаг 1: Настройка базы данных

1. Откройте [Timeweb Cloud](https://timeweb.cloud/my/projects/2005839)
2. Создайте PostgreSQL базу данных
3. Примените схему БД:
   - Откройте SQL Editor
   - Скопируйте содержимое `TIMEWEB_FULL_SCHEMA.sql`
   - Выполните скрипт

## Шаг 2: Деплой бэкенда

### 2.1 Подготовка

1. Перейдите в папку `server`:
   ```bash
   cd server
   ```

2. Создайте `.env`:
   ```bash
   cp env.example .env
   ```

3. Заполните `server/.env`:
   ```env
   TIMEWEB_DB_HOST=your-timeweb-db-host.twc1.net
   TIMEWEB_DB_PORT=5432
   TIMEWEB_DB_NAME=default_db
   TIMEWEB_DB_USER=gen_user
   TIMEWEB_DB_PASSWORD=your-password
   TIMEWEB_DB_SSL=true
   TIMEWEB_DB_SSL_CERT=./ca.crt
   TIMEWEB_DB_SSL_MODE=verify-full
   PORT=3001
   NODE_ENV=production
   JWT_SECRET=сгенерируйте-командой: openssl rand -base64 32
   JWT_EXPIRES_IN=7d
   ALLOWED_ORIGINS=http://localhost:8080
   WS_PORT=3001
   ```

4. Скопируйте `ca.crt` в папку `server`

### 2.2 Деплой через Timeweb App Platform

1. В Timeweb Cloud создайте новое приложение
2. Подключите GitHub репозиторий
3. Настройки:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Port**: `3001`
   - **Environment Variables**: Скопируйте все из `server/.env`
4. Задеплойте

### 2.3 Получение URL бэкенда

После деплоя запишите URL бэкенда (например: `https://api.your-app.twc1.net`)

## Шаг 3: Деплой фронтенда

### Вариант A: Статический хостинг (рекомендуется)

1. **Соберите фронтенд локально:**
   ```bash
   # В корне проекта
   npm install
   npm run build
   ```

2. **Создайте .env для сборки:**
   ```bash
   cp env.example .env
   ```
   
   Заполните `.env`:
   ```env
   VITE_API_URL=https://your-backend-url.twc1.net
   VITE_WS_URL=wss://your-backend-url.twc1.net
   ```

3. **Пересоберите с правильными переменными:**
   ```bash
   npm run build
   ```

4. **Загрузите папку `dist/` на Timeweb:**
   - В Timeweb Cloud создайте статический сайт
   - Загрузите содержимое папки `dist/`
   - Или используйте FTP/SFTP для загрузки

### Вариант B: App Platform (альтернатива)

1. В Timeweb Cloud создайте новое приложение
2. Подключите GitHub репозиторий
3. Настройки:
   - **Root Directory**: `.` (корень проекта)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve -s dist -l 3000`
   - **Port**: `3000`
   - **Environment Variables**:
     ```
     VITE_API_URL=https://your-backend-url.twc1.net
     VITE_WS_URL=wss://your-backend-url.twc1.net
     ```
4. Задеплойте

### Вариант C: Nginx конфигурация (если есть доступ)

Создайте `nginx.conf`:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/ride-together/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass https://your-backend-url.twc1.net;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Шаг 4: Настройка CORS

После получения домена фронтенда:

1. Обновите `ALLOWED_ORIGINS` в бэкенде:
   ```env
   ALLOWED_ORIGINS=https://your-frontend-domain.twc1.net,https://www.your-frontend-domain.twc1.net
   ```

2. Перезапустите бэкенд

## Шаг 5: Проверка

1. Откройте домен фронтенда
2. Проверьте консоль браузера (F12) - нет ошибок
3. Попробуйте зарегистрироваться/войти
4. Проверьте Network tab - запросы идут на правильный API

## Структура после деплоя

```
Timeweb Cloud:
├── PostgreSQL Database
├── Backend App (App Platform)
│   └── server/ (Node.js/Express)
└── Frontend (Static Hosting или App Platform)
    └── dist/ (React build)
```

## Преимущества деплоя всего на Timeweb

✅ Все в одном месте  
✅ Проще управление  
✅ Нет проблем с CORS между разными доменами  
✅ Единый биллинг  
✅ Быстрая связь между сервисами  

## Troubleshooting

### Фронтенд не подключается к API

- Проверьте `VITE_API_URL` в переменных окружения
- Убедитесь, что бэкенд доступен по указанному URL
- Проверьте CORS настройки

### Ошибки 404 на роутах

- Убедитесь, что настроен `try_files` в nginx или используется SPA режим
- Проверьте, что `index.html` отдается для всех роутов

### WebSocket не работает

- Проверьте `VITE_WS_URL` (должен начинаться с `wss://`)
- Убедитесь, что WebSocket порт открыт на бэкенде
