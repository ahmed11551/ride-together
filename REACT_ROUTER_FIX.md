# 🔧 Исправление ошибки React Router

## Проблема

```
Uncaught TypeError: Cannot read properties of undefined (reading '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED')
at react-router-Xku7AyKG.js:17
```

## Причина

React Router загружается до того, как React полностью загружен. Это происходит из-за code splitting в Vite.

## Решение

### 1. React Router теперь в entry chunk

В `vite.config.ts` обновлена конфигурация `manualChunks`:

```typescript
manualChunks: (id) => {
  // React Router теперь тоже в entry chunk вместе с React
  if (id.includes('node_modules/react-router/')) {
    return undefined; // React Router остается в entry
  }
  // ... остальная логика
}
```

### 2. Правильный порядок импортов

В `src/main.tsx`:
- React импортируется первым
- App импортируется после всех setup функций

### 3. Modulepreload для entry chunk

Плагин `fixScriptOrder` теперь:
- Добавляет `modulepreload` для entry chunk ПЕРВЫМ в `<head>`
- Гарантирует, что entry chunk загружается первым

## Проверка

После сборки проверьте:

1. **Entry chunk содержит React и React Router:**
   ```bash
   npm run build
   # Проверьте dist/assets/js/index-*.js - должен содержать React и React Router
   ```

2. **В index.html entry chunk загружается первым:**
   - Откройте `dist/index.html`
   - Убедитесь, что `<script type="module" src="/assets/js/index-*.js">` идет первым

3. **Modulepreload для entry chunk:**
   - В `<head>` должен быть `<link rel="modulepreload" href="/assets/js/index-*.js">`

## Если ошибка сохраняется

1. Очистите кэш:
   ```bash
   rm -rf node_modules/.vite
   rm -rf dist
   npm run build
   ```

2. Проверьте Network tab в браузере:
   - Entry chunk должен загрузиться первым
   - React Router chunk не должен существовать (он в entry)

3. Проверьте консоль:
   - Не должно быть ошибок загрузки модулей
   - React должен быть доступен до загрузки React Router
