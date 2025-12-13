# Анализ ошибки "Sorry, this user doesn't seem to exist"

## Описание ошибки

Ошибка отображается в модальном окне (темная тема, синяя кнопка "OK") с текстом:
**"Sorry, this user doesn't seem to exist."**

## Возможные источники

### 1. Telegram Web App Alert
Это может быть нативный alert от Telegram Web App API, который вызывается через `window.Telegram.WebApp.showAlert()`.

**Где может вызываться:**
- В `useTelegramAuth` при ошибке авторизации
- В `TelegramContext` при ошибке инициализации
- В других местах, где используется Telegram API

### 2. Supabase ошибка
Ошибка может возникать при попытке найти пользователя в БД:
- В `useProfile` при запросе профиля
- В `useTelegramAuth` при поиске профиля по `telegram_id`
- В других местах, где ищется пользователь

### 3. Telegram Bot Edge Function
Ошибка может приходить от Telegram бота при попытке найти пользователя в БД.

## Проверка кода

### Проверено:
- ✅ В коде нет строки "Sorry, this user doesn't seem to exist"
- ✅ В Telegram Bot Edge Function нет такой строки
- ✅ В error-handler.ts нет такой строки

### Вероятная причина:

**Сценарий 1: Telegram Auth ошибка**
В `useTelegramAuth.ts` при попытке найти профиль по `telegram_id`:
```typescript
const { data: existingProfile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('telegram_id', telegramUser.id.toString())
  .single();
```

Если профиль не найден и есть ошибка (не PGRST116), она может быть обработана неправильно.

**Сценарий 2: Profile не найден**
В `useProfile.ts` при обновлении профиля:
```typescript
const { data: existingProfile } = await supabase
  .from("profiles")
  .select("id, user_id")
  .eq("user_id", user.id)
  .maybeSingle();
```

Если профиль не существует, код создает новый, но может быть ошибка при создании.

**Сценарий 3: Telegram Web App Alert**
Где-то в коде может вызываться `webApp.showAlert()` с этой ошибкой, но это не наш код - возможно, это стандартное сообщение от Telegram API.

## Решение

### Вариант 1: Улучшить обработку ошибок в useTelegramAuth

Добавить более детальную обработку ошибок при поиске профиля:

```typescript
if (profileError && profileError.code !== 'PGRST116') {
  // Логируем ошибку, но не показываем пользователю технические детали
  console.error('Profile lookup error:', profileError);
  // Продолжаем создание нового профиля вместо показа ошибки
}
```

### Вариант 2: Улучшить обработку ошибок в useProfile

Убедиться, что при создании профиля все поля корректны:

```typescript
if (!existingProfile) {
  // Убедиться, что все обязательные поля заполнены
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      display_name: defaultName,
      full_name: updates.full_name || defaultName,
      ...insertFields,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    // Более детальная обработка ошибки
    console.error('Profile create error:', error);
    throw new Error('Не удалось создать профиль. Попробуйте еще раз.');
  }
}
```

### Вариант 3: Проверить Telegram Web App API

Если ошибка приходит от Telegram API, нужно проверить:
- Корректность `initData` от Telegram
- Валидность `telegram_id`
- Наличие пользователя в `auth.users` таблице Supabase

## Рекомендации

1. **Добавить логирование** - чтобы понять, откуда именно приходит ошибка
2. **Улучшить обработку ошибок** - показывать пользователю понятные сообщения
3. **Проверить миграции** - убедиться, что все поля профиля корректны
4. **Проверить RLS политики** - возможно, проблема с доступом к данным

## Следующие шаги

1. Проверить логи браузера (Console) при возникновении ошибки
2. Проверить логи Supabase (Edge Functions, Database)
3. Добавить более детальное логирование в `useTelegramAuth` и `useProfile`
4. Улучшить обработку ошибок для показа понятных сообщений пользователю

