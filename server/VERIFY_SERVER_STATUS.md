# ✅ Проверка статуса сервера

## Анализ логов

Судя по логам, сервер **запускается** (видно "Server running on http://0.0.0.0:3001"), но есть ошибки `__dirname` в error.log.

Это может означать:
1. Сервер перезапускался несколько раз из-за ошибки
2. Но в итоге запустился успешно

---

## Проверка текущего состояния

### 1. Проверить, что сервер работает:

```bash
curl http://localhost:3001/health
```

Если получаете `{"status":"ok"...}` - сервер работает! ✅

### 2. Проверить файл dist/index.js:

```bash
cd /var/www/ride-together/server/dist
grep -n "path.join(__dirname" index.js
```

Если ничего не выводится - файл исправлен ✅
Если выводит строки - нужно исправить (см. ниже)

### 3. Проверить синтаксис:

```bash
node --check /var/www/ride-together/server/dist/index.js
```

Если ошибок нет - всё ОК ✅

---

## Если сервер работает, но есть ошибки в error.log

### Вариант 1: Игнорировать старые ошибки

Если `curl http://localhost:3001/health` работает, значит сервер исправлен. Старые ошибки в error.log - это история предыдущих запусков.

### Вариант 2: Убедиться, что файл исправлен

```bash
cd /var/www/ride-together/server/dist

# Проверить и исправить при необходимости
sed -i 's/path\.join(__dirname,/path.join(process.cwd(),/g' index.js

# Проверить синтаксис
node --check index.js

# Перезапустить для чистых логов
pm2 restart ride-backend
```

---

## Финальная проверка

```bash
# 1. Проверить health
curl http://localhost:3001/health

# 2. Проверить последние логи (должны быть только успешные запуски)
pm2 logs ride-backend --lines 10 --nostream

# 3. Проверить статус PM2
pm2 status
```

Если всё работает - готово! ✅

---

## Если всё равно есть ошибки

Выполните полную пересборку:

```bash
cd /var/www/ride-together/server

# Пересборка
rm -rf dist
npx tsc --noEmitOnError false
node fix-imports.js

# Проверка
node --check dist/index.js

# Перезапуск
pm2 restart ride-backend
```

---

## Итог

Если `curl http://localhost:3001/health` возвращает `{"status":"ok"}` - сервер работает правильно, старые ошибки можно игнорировать! ✅

