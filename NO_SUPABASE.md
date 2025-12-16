# ✅ Supabase не используется

## Статус

**Supabase полностью отключен** - приложение использует только кастомный backend API.

## Что сделано

1. ✅ Supabase клиент заменен на dummy-клиент (не используется)
2. ✅ Все вызовы Supabase возвращают пустые данные
3. ✅ Приложение работает только с кастомным backend через `@/lib/api-client`

## Переменные окружения

### Обязательные (для кастомного backend):

```
VITE_API_URL=https://your-backend-url.twc1.net
VITE_WS_URL=wss://your-backend-url.twc1.net
```

### НЕ нужны (Supabase):

```
VITE_SUPABASE_URL - НЕ НУЖНА
VITE_SUPABASE_PUBLISHABLE_KEY - НЕ НУЖНА
```

## Архитектура

Приложение использует:
- ✅ **Кастомный backend API** (`VITE_API_URL`) - для всех запросов
- ✅ **WebSocket** (`VITE_WS_URL`) - для realtime
- ✅ **Кастомный auth** - через backend API
- ❌ **Supabase** - НЕ используется (deprecated)

## Что делать на Timeweb

1. **Добавьте только эти переменные:**
   ```
   VITE_API_URL=https://your-backend-url.twc1.net
   VITE_WS_URL=wss://your-backend-url.twc1.net
   ```

2. **НЕ добавляйте Supabase переменные** - они не нужны

3. **Запустите деплой**

## Проверка

После деплоя:
- ✅ Нет ошибок про Supabase
- ✅ Приложение работает с кастомным backend
- ✅ Auth работает через кастомный API
