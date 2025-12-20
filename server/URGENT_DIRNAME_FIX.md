# 🚨 СРОЧНОЕ исправление __dirname на сервере

## Проблема:
```
ReferenceError: __dirname is not defined in ES module scope
at file:///var/www/ride-together/server/dist/index.js:10:17
```

## ⚡ БЫСТРОЕ РЕШЕНИЕ (скопируйте и выполните на сервере):

```bash
cd /var/www/ride-together/server/dist
sed -i 's/path\.join(__dirname,/path.join(process.cwd(),/g' index.js
node --check index.js && echo "✅ OK" || echo "❌ Error"
pm2 restart ride-backend
pm2 logs ride-backend --lines 10
```

---

## 📋 Пошагово:

### Шаг 1: Исправление файла

```bash
cd /var/www/ride-together/server/dist
sed -i 's/path\.join(__dirname,/path.join(process.cwd(),/g' index.js
```

### Шаг 2: Проверка синтаксиса

```bash
node --check index.js
```

Если выводит "SyntaxError" - что-то пошло не так. Если ничего не выводит - всё ОК.

### Шаг 3: Перезапуск

```bash
pm2 restart ride-backend
```

### Шаг 4: Проверка логов

```bash
pm2 logs ride-backend --lines 20
```

Если видите "Server running on http://0.0.0.0:3001" - всё работает! ✅

---

## 🔍 Что делает команда:

`sed -i 's/path\.join(__dirname,/path.join(process.cwd(),/g' index.js`

- `s/old/new/g` - заменяет все вхождения
- `path\.join(__dirname,` → `path.join(process.cwd(),`
- `-i` - редактирует файл на месте
- Результат: все использования `__dirname` заменяются на `process.cwd()`

---

## ✅ Готово!

После этого сервер должен запуститься без ошибок.

Если проблема осталась, проверьте логи:
```bash
pm2 logs ride-backend --err --lines 50
```

