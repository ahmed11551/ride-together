# 🔧 СРОЧНОЕ исправление __dirname

## Проблема:
```
ReferenceError: __dirname is not defined in ES module scope
```

## Решение на сервере:

### Вариант 1: Простой способ (рекомендуется)

```bash
cd /var/www/ride-together/server/dist
sed -i 's/path\.join(__dirname,/path.join(process.cwd(),/g' index.js
node --check index.js
pm2 restart ride-backend
```

### Вариант 2: Использовать скрипт

```bash
cd /var/www/ride-together/server
chmod +x FIX_DIRNAME_SIMPLE.sh
./FIX_DIRNAME_SIMPLE.sh
pm2 restart ride-backend
```

### Вариант 3: Ручное исправление

```bash
cd /var/www/ride-together/server/dist
nano index.js
# Найдите все места с path.join(__dirname,
# Замените на path.join(process.cwd(),
# Сохраните (Ctrl+O, Enter, Ctrl+X)
pm2 restart ride-backend
```

---

## Что делает исправление:

Проблема в том, что в ES modules нет `__dirname`. Мы заменяем все использования `path.join(__dirname, ...)` на `path.join(process.cwd(), ...)`, что работает в ES modules.

---

## Проверка после исправления:

```bash
# Проверить синтаксис
node --check /var/www/ride-together/server/dist/index.js

# Перезапустить
pm2 restart ride-backend

# Проверить логи
pm2 logs ride-backend --lines 20
```

---

## Готово! ✅

После этого сервер должен запуститься без ошибок.

