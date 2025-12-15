# Исправление ошибки React createContext

## Проблема
```
Uncaught TypeError: Cannot read properties of undefined (reading 'createContext')
```

## Причина
React не загружался правильно из-за неправильного разделения на чанки при сборке.

## Исправления

1. **Объединение React в один чанк** - React и react-dom теперь в одном чанке `react-vendor`
2. **Явные импорты React** - добавлены в `main.tsx` и `App.tsx`
3. **Улучшенная оптимизация зависимостей** - добавлен `react/jsx-runtime` и `react-dom/client`

## Что нужно сделать

1. Пересобрать проект:
   ```bash
   npm run build
   ```

2. Задеплоить на Timeweb Cloud

3. Проверить, что ошибка исчезла

## Если проблема останется

Попробуйте упростить разделение на чанки - временно отключите `manualChunks`:

```typescript
// В vite.config.ts временно закомментируйте manualChunks
// manualChunks: (id) => { ... },
```

Это создаст один большой бандл, но гарантирует правильный порядок загрузки.
