# ⚡ Простое исправление - выполните на сервере

## Команды:

```bash
cd /var/www/ride-together/server/dist

# Показать что на строке 10
echo "Строка 10:"
sed -n '10p' index.js

# Показать первые 15 строк
echo ""
echo "Первые 15 строк:"
head -15 index.js | cat -n

# Заменить все использования __dirname на process.cwd()
sed -i 's/__dirname/process.cwd()/g' index.js

# Проверить синтаксис
node --check index.js

# Если OK - перезапустить
cd /var/www/ride-together/server
pm2 restart ride-backend

# Проверить логи
pm2 logs ride-backend --lines 10
```

---

## Объяснение:

Команда `sed -i 's/__dirname/process.cwd()/g' index.js` заменяет **все** вхождения `__dirname` на `process.cwd()`.

Это безопасно, потому что:
- `process.cwd()` всегда доступен в ES modules
- Работает так же как `__dirname` для путей к файлам проекта

---

## После исправления:

Проверьте, что сервер запустился без ошибок:

```bash
curl http://localhost:3001/health
```

Если возвращает `{"status":"ok"...}` - всё работает! ✅

