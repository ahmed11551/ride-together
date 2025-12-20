# ⚡ Выполните ЭТИ команды на сервере:

## Шаг 1: Проверка и исправление

```bash
cd /var/www/ride-together/server/dist

# Показать строку 10 (проблемная строка)
echo "=== Строка 10 ==="
sed -n '10p' index.js

# Показать все использования __dirname
echo ""
echo "=== Все использования __dirname ==="
grep -n "__dirname" index.js

# ЗАМЕНИТЬ все __dirname на process.cwd()
echo ""
echo "=== Замена __dirname на process.cwd() ==="
sed -i 's/__dirname/process.cwd()/g' index.js

# Проверить синтаксис
echo ""
echo "=== Проверка синтаксиса ==="
node --check index.js

# Показать строку 10 после исправления
echo ""
echo "=== Строка 10 после исправления ==="
sed -n '10p' index.js
```

## Шаг 2: Перезапуск

```bash
cd /var/www/ride-together/server
pm2 restart ride-backend
sleep 3
pm2 logs ride-backend --lines 20
```

## Шаг 3: Проверка

```bash
curl http://localhost:3001/health
```

---

## Если всё ещё есть ошибки:

Выполните полную пересборку:

```bash
cd /var/www/ride-together/server
rm -rf dist
npx tsc --noEmitOnError false
node fix-imports.js
sed -i 's/__dirname/process.cwd()/g' dist/index.js
node --check dist/index.js
pm2 restart ride-backend
```

---

## Важно:

Команда `sed -i 's/__dirname/process.cwd()/g' index.js` заменяет **ВСЕ** вхождения `__dirname` на `process.cwd()`. 

Это безопасно, потому что `process.cwd()` всегда доступен в ES modules и работает так же для путей к файлам проекта.

