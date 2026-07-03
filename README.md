# Ride Together

Платформа для поиска попутчиков и совместных поездок.

Работает как **веб-сайт** на десктопе и как **PWA / Telegram Mini App** на мобильных устройствах.

## Стек

| Слой | Технологии |
|------|------------|
| Frontend | React 18, Vite, TypeScript, Tailwind, shadcn/ui |
| Backend | Node.js, Express, TypeScript, PostgreSQL |
| Realtime | Socket.io (чат, геолокация) |
| Auth | JWT + bcrypt |

## Быстрый старт (локально)

### 1. База данных

```bash
psql -U postgres -d ride_together -f database/schema.sql
```

### 2. Backend

```bash
cd server
cp env.example .env   # заполните DATABASE_URL и JWT_SECRET
npm install
npm run dev           # http://localhost:3001
```

### 3. Frontend

```bash
cp env.example .env   # VITE_API_URL=http://localhost:3001
npm install
npm run dev           # http://localhost:8080
```

## Деплой на новый сервер

1. **PostgreSQL** — выполните `database/schema.sql`
2. **Backend** — `npm run build && npm start` (или PM2 через `ecosystem.config.cjs`)
3. **Frontend** — `npm run build`, раздайте `dist/` через nginx
4. **Nginx** — проксируйте `/api` и `/socket.io` на backend (см. `nginx-regru.conf.example`)

### Переменные окружения

**Backend** (`server/.env`):
- `DATABASE_URL` — строка подключения PostgreSQL
- `JWT_SECRET` — секрет для JWT (мин. 32 символа)
- `ALLOWED_ORIGINS` — домены фронтенда через запятую
- `FRONTEND_URL` — URL фронтенда
- `TELEGRAM_BOT_TOKEN` — для Mini App auth и уведомлений

**Frontend** (`.env`):
- `VITE_API_URL` — URL backend API

## Структура

```
src/          — React frontend
server/       — Express backend
database/     — SQL-схема для новой БД
scripts/      — утилиты деплоя и тестов
e2e/          — Playwright E2E тесты
```

## Режимы работы

- **Десктоп** — полноценный сайт с навигацией в шапке
- **Мобильный браузер** — нижняя навигация (BottomNav), PWA
- **Telegram Mini App** — автоматическая авторизация через Telegram
