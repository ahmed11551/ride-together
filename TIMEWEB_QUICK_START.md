# ⚡ Быстрый старт на Timeweb

## 🎯 Минимальные шаги для запуска

### 1. Backend (Node.js)

**Создайте файл `server/.env`** (если Timeweb не поддерживает Environment Variables через UI):

```bash
DATABASE_URL=postgresql://gen_user:fn)un5%40K2oLrBJ@9d497bc2bf9dd679bd9834af.twc1.net:5432/default_db?sslmode=verify-full
JWT_SECRET=$(openssl rand -base64 32)
ALLOWED_ORIGINS=https://ваш-frontend-домен.twc1.net
FRONTEND_URL=https://ваш-frontend-домен.twc1.net
PORT=3001
NODE_ENV=production
```

**Или добавьте в код** (временно, для теста):

Откройте `server/index.ts` и добавьте в начало:

```typescript
// Временная конфигурация (замените на Environment Variables)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://gen_user:fn)un5%40K2oLrBJ@9d497bc2bf9dd679bd9834af.twc1.net:5432/default_db?sslmode=verify-full';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your-temporary-secret-key-change-this-in-production';
}
```

### 2. База данных

**Примените SQL схему:**

1. Откройте файл `TIMEWEB_FULL_SCHEMA.sql`
2. Скопируйте весь текст
3. В Timeweb Dashboard → Базы данных → SQL Editor
4. Вставьте и выполните

**Или через psql (если есть SSH доступ):**

```bash
psql 'postgresql://gen_user:fn)un5%40K2oLrBJ@9d497bc2bf9dd679bd9834af.twc1.net:5432/default_db?sslmode=verify-full' < TIMEWEB_FULL_SCHEMA.sql
```

### 3. Frontend

**Добавьте в код** (временно):

Откройте `src/lib/api-client.ts` и найдите где используется `VITE_API_URL`.

Или создайте файл `.env.production` в корне проекта:

```bash
VITE_API_URL=https://ваш-backend-домен.twc1.net
VITE_WS_URL=wss://ваш-backend-домен.twc1.net
```

---

## 🔧 Где искать настройки в Timeweb Dashboard

### Если используете App Platform:

1. **Откройте ваше приложение**
2. **"Настройки"** или **"Settings"**
3. **"Переменные окружения"** или **"Environment Variables"**
4. **"Добавить переменную"**

### Если используете Cloud Server:

1. **Подключитесь по SSH**
2. **Создайте `.env` файл** в директории проекта
3. **Добавьте переменные**

### Если используете Static Hosting:

1. **"Настройки сайта"**
2. **"Переменные окружения"** (может быть в разделе "Build")
3. Или настройте через **"Build Settings"**

---

## 📞 Нужна помощь?

Если не можете найти нужные опции:

1. **Скриншот** вашего Timeweb Dashboard
2. **Какой тип сервиса** используете (App Platform, Cloud Server, Static Hosting)
3. **Что именно** не можете найти

И я помогу найти нужные настройки!
