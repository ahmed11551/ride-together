# 🔄 Полная миграция с Supabase на Timeweb Cloud

## ⚠️ ВАЖНО: Это большая задача!

**Время выполнения:** 2-3 дня работы  
**Сложность:** Высокая  
**Риски:** Возможна потеря данных, если не сделать правильно

---

## 📊 Что нужно мигрировать

### 1. База данных PostgreSQL
- ✅ Все таблицы и данные
- ✅ Все миграции
- ✅ Триггеры и функции
- ✅ Индексы

### 2. Система авторизации (Auth)
- ❌ Supabase Auth → Своя система
- ❌ JWT токены
- ❌ Сессии
- ❌ Регистрация/Вход

### 3. Realtime (WebSocket)
- ❌ Supabase Realtime → Свой WebSocket сервер
- ❌ Чат в реальном времени
- ❌ Отслеживание поездок

### 4. Edge Functions
- ❌ Telegram бот (Edge Function)
- ❌ Push уведомления

---

## 🎯 План миграции (пошагово)

### Фаза 1: Подготовка (1-2 часа)

#### Шаг 1: Создание БД в Timeweb Cloud

1. Откройте: https://timeweb.cloud/my/projects/2005839
2. Перейдите в **Databases** → **Create Database**
3. Выберите **PostgreSQL**
4. Выберите конфигурацию (минимум 1 ГБ)
5. Запишите данные подключения:
   - Host
   - Port
   - Database name
   - Username
   - Password

#### Шаг 2: Экспорт данных из Supabase

**Вариант A: Через Supabase Dashboard**
1. Supabase Dashboard → Database → Backups
2. Создайте backup
3. Скачайте SQL дамп

**Вариант B: Через pg_dump**
```bash
# Установите PostgreSQL клиент
brew install postgresql  # macOS
# или
sudo apt-get install postgresql-client  # Linux

# Экспорт схемы и данных
pg_dump -h db.vcjnvkdqjrqymnmqdvfr.supabase.co \
  -U postgres \
  -d postgres \
  --schema=public \
  --no-owner \
  --no-privileges \
  > supabase_backup.sql
```

**Вариант C: Через Supabase CLI**
```bash
supabase db dump -f supabase_backup.sql
```

---

### Фаза 2: Импорт данных (1-2 часа)

#### Шаг 3: Импорт в Timeweb Cloud

```bash
# Подключитесь к БД Timeweb
psql -h timeweb-db-host \
  -U timeweb-user \
  -d timeweb-database \
  < supabase_backup.sql
```

**Или через панель Timeweb:**
1. Databases → Ваша БД → SQL Editor
2. Вставьте содержимое `supabase_backup.sql`
3. Выполните

#### Шаг 4: Применение миграций

Примените все миграции из `supabase/migrations/`:

1. `20251213021331_7a00ec87-3392-4efa-8263-d4d1fe272d41.sql`
2. `20251213021356_a5c9a937-87f4-46c5-8704-a93d5b858511.sql`
3. `20250127000000_add_reports_and_admin.sql`
4. `20250128000000_add_telegram_fields.sql`
5. `20250129000000_add_subscriptions.sql`
6. `20250129000001_add_support_tickets.sql`
7. `20250130000000_cleanup_old_rides.sql`
8. `20250130000001_fix_profile_creation_trigger.sql`
9. `20250130000002_fix_security_and_performance.sql`
10. `20250131000000_improve_database_stability.sql`
11. `20250131000001_add_passenger_rating.sql`

**Важно:** Некоторые миграции могут конфликтовать, так как данные уже импортированы. Нужно будет адаптировать.

---

### Фаза 3: Замена Auth системы (4-6 часов)

#### Шаг 5: Создание своей Auth системы

**Вариант A: Использовать готовую библиотеку**

```bash
npm install @auth/core next-auth
# или
npm install passport passport-local passport-jwt
```

**Вариант B: Создать свою систему**

Нужно создать:
1. Таблицу `users` (вместо `auth.users`)
2. Таблицу `sessions` для хранения сессий
3. API endpoints для:
   - `/api/auth/signup`
   - `/api/auth/signin`
   - `/api/auth/signout`
   - `/api/auth/refresh`
4. JWT генерацию и валидацию
5. Хеширование паролей (bcrypt)

**Структура таблиц:**

```sql
-- Таблица пользователей
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Таблица сессий
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Миграция данных из auth.users
INSERT INTO public.users (id, email, full_name, created_at)
SELECT id, email, raw_user_meta_data->>'full_name', created_at
FROM auth.users;
```

#### Шаг 6: Обновление кода авторизации

**Файлы для изменения:**
- `src/contexts/AuthContext.tsx` - полностью переписать
- `src/integrations/supabase/client.ts` - заменить на свой API клиент
- Все компоненты, использующие `useAuth()`

**Новый AuthContext:**

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверка сессии при загрузке
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Валидация токена через API
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) setUser(data.user);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
    }
    return { error: data.error ? new Error(data.error) : null };
  };

  const signIn = async (email: string, password: string) => {
    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
    }
    return { error: data.error ? new Error(data.error) : null };
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    await fetch('/api/auth/signout', { method: 'POST' });
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### Шаг 7: Создание API endpoints

**Нужно создать backend сервер:**

**Вариант A: Node.js/Express сервер**
```typescript
// server/api/auth/signup.ts
import { hash } from 'bcrypt';
import { generateToken } from './jwt';
import { db } from './database';

export async function signUp(req, res) {
  const { email, password, fullName } = req.body;
  
  // Хешируем пароль
  const passwordHash = await hash(password, 10);
  
  // Создаем пользователя
  const { rows } = await db.query(
    'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name',
    [email, passwordHash, fullName]
  );
  
  const user = rows[0];
  const token = generateToken(user.id);
  
  // Создаем профиль
  await db.query(
    'INSERT INTO profiles (user_id, full_name) VALUES ($1, $2)',
    [user.id, fullName]
  );
  
  res.json({ token, user });
}
```

**Вариант B: Использовать Timeweb Cloud Functions**
- Создать serverless функции для Auth
- Настроить API Gateway

---

### Фаза 4: Замена Realtime (3-4 часа)

#### Шаг 8: Настройка WebSocket сервера

**Вариант A: Socket.io**

```bash
npm install socket.io
```

**Создать WebSocket сервер:**

```typescript
// server/websocket.ts
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  socket.on('join-ride', (rideId) => {
    socket.join(`ride-${rideId}`);
  });

  socket.on('message', async (data) => {
    // Сохранить сообщение в БД
    const message = await saveMessage(data);
    
    // Отправить всем участникам поездки
    io.to(`ride-${data.rideId}`).emit('new-message', message);
  });
});
```

**Обновить клиент:**

```typescript
// src/hooks/useMessages.ts
import { io } from 'socket.io-client';

const socket = io('wss://your-timeweb-domain.com');

export const useMessages = (rideId: string) => {
  useEffect(() => {
    socket.emit('join-ride', rideId);
    
    socket.on('new-message', (message) => {
      // Обновить состояние
    });
    
    return () => {
      socket.off('new-message');
    };
  }, [rideId]);
};
```

**Вариант B: Использовать готовый сервис**
- Pusher
- Ably
- PubNub

---

### Фаза 5: Перенос Edge Functions (2-3 часа)

#### Шаг 9: Перенос Telegram бота

**Текущий:** `supabase/functions/telegram-bot/index.ts`

**Новый вариант:**

**Вариант A: Timeweb Cloud Functions**
- Создать serverless функцию
- Настроить webhook для Telegram

**Вариант B: Отдельный сервер**
- Создать Node.js сервер для бота
- Задеплоить на Timeweb Cloud VPS
- Настроить webhook

**Вариант C: Использовать готовый сервис**
- Railway для бота
- Render для бота
- Отдельный VPS

---

## 📋 Чеклист миграции

### Подготовка
- [ ] Создать БД в Timeweb Cloud
- [ ] Экспортировать данные из Supabase
- [ ] Создать backup

### Импорт данных
- [ ] Импортировать схему БД
- [ ] Импортировать данные
- [ ] Применить все миграции
- [ ] Проверить целостность данных

### Auth система
- [ ] Создать таблицы users и sessions
- [ ] Мигрировать пользователей из auth.users
- [ ] Создать API endpoints для Auth
- [ ] Обновить AuthContext
- [ ] Обновить все компоненты
- [ ] Протестировать регистрацию/вход

### Realtime
- [ ] Настроить WebSocket сервер
- [ ] Обновить клиент для чата
- [ ] Обновить отслеживание поездок
- [ ] Протестировать realtime функции

### Edge Functions
- [ ] Перенести Telegram бота
- [ ] Настроить webhook
- [ ] Протестировать бота

### Тестирование
- [ ] Протестировать все функции
- [ ] Проверить производительность
- [ ] Проверить безопасность

---

## ⚠️ Важные замечания

### Проблемы, которые возникнут:

1. **RLS политики используют `auth.uid()`**
   - Нужно заменить на свою функцию проверки пользователя
   - Или использовать middleware для проверки прав

2. **Триггеры используют `auth.users`**
   - Нужно обновить триггеры для работы с новой таблицей `users`

3. **Realtime подписки**
   - Supabase Realtime использует PostgreSQL replication
   - Нужно настроить свой механизм

4. **Edge Functions**
   - Supabase Edge Functions - это Deno runtime
   - Нужно переписать под Node.js или другой runtime

---

## 💰 Стоимость миграции

**Время:** 2-3 дня работы  
**Сложность:** Высокая  
**Риски:** Высокие (возможна потеря данных)

**Альтернатива:** Оставить Supabase для БД, использовать Timeweb только для фронтенда

---

## 🎯 Рекомендация

### ❌ НЕ рекомендую полную миграцию, потому что:

1. ❌ Очень сложно и долго
2. ❌ Высокий риск потери данных
3. ❌ Нужно переписать много кода
4. ❌ Нужно поддерживать свою Auth систему
5. ❌ Нужно поддерживать свой WebSocket сервер
6. ❌ Supabase бесплатен и работает отлично

### ✅ Рекомендую гибридный подход:

```
┌─────────────────────┐
│  Timeweb Cloud      │
│  (Фронтенд)         │
└─────────────────────┘
         │
         │ HTTP
         ▼
┌─────────────────────┐
│  Supabase           │
│  (БД + Auth +       │
│   Realtime)         │
└─────────────────────┘
```

**Преимущества:**
- ✅ Быстрая миграция (5 минут)
- ✅ Нет риска потери данных
- ✅ Всё уже работает
- ✅ Бесплатно
- ✅ Можно мигрировать постепенно

---

## 🚀 Если всё-таки нужна полная миграция

Готов помочь с:
1. Созданием скриптов экспорта/импорта
2. Настройкой Auth системы
3. Настройкой WebSocket
4. Переносом Edge Functions

**Но это займет 2-3 дня работы!**

---

**Рекомендация:** Начните с деплоя фронтенда на Timeweb, оставьте Supabase для БД. Это самый безопасный и быстрый вариант.

Нужна помощь с полной миграцией или лучше использовать гибридный подход?
