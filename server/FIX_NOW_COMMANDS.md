# 🔧 Команды для исправления прямо на сервере

## Выполните эти команды по порядку:

```bash
# 1. Перейти в dist и исправить файл
cd /var/www/ride-together/server/dist
sed -i 's/path\.join(__dirname,/path.join(process.cwd(),/g' index.js

# 2. Проверить синтаксис
node --check index.js

# 3. Если синтаксис OK, перезапустить
pm2 restart ride-backend

# 4. Проверить логи
pm2 logs ride-backend --lines 10
```

---

## Или одной строкой:

```bash
cd /var/www/ride-together/server/dist && sed -i 's/path\.join(__dirname,/path.join(process.cwd(),/g' index.js && node --check index.js && cd .. && pm2 restart ride-backend && pm2 logs ride-backend --lines 10
```

---

## Проверка результата:

После перезапуска проверьте:

```bash
# Health check
curl http://localhost:3001/health

# Логи (должны быть только успешные запуски)
pm2 logs ride-backend --lines 20
```

Если видите "Server running on http://0.0.0.0:3001" без ошибок - всё работает! ✅

