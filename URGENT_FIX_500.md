# ⚠️ СРОЧНОЕ ИСПРАВЛЕНИЕ ОШИБОК 500

## 🔍 Первый шаг - диагностика

На сервере выполните:

```bash
cd /var/www/ride-together/server
bash DIAGNOSE_500.sh
```

Или вручную:

```bash
pm2 logs ride-backend --err --lines 50 --nostream
```

---

## 🔧 Возможные быстрые исправления:

### Вариант 1: Проверить что код скомпилирован

```bash
cd /var/www/ride-together/server

# Проверить что dist/index.js существует
ls -lh dist/index.js

# Если нет - пересобрать
npm ci
npx tsc --noEmitOnError false || true
node fix-imports.js

pm2 restart ride-backend --update-env
```

### Вариант 2: Проверить переменные окружения

```bash
# Проверить что DATABASE_URL и JWT_SECRET установлены
pm2 show ride-backend | grep -E "DATABASE_URL|JWT_SECRET"

# Если нет - проверить ecosystem.config.cjs
cat ecosystem.config.cjs | grep -E "DATABASE_URL|JWT_SECRET"
```

### Вариант 3: Откатить к рабочей версии

Если ничего не помогает, можно временно откатить изменения:

```bash
cd /var/www/ride-together/server

# Создать бэкап
cp dist/index.js dist/index.js.backup

# Проверить есть ли старая рабочая версия
# Если да - восстановить
# cp dist/index.js.backup dist/index.js

pm2 restart ride-backend
```

---

## 📋 ОТПРАВЬТЕ МНЕ:

Выполните и отправьте вывод:

```bash
pm2 logs ride-backend --err --lines 50 --nostream
```

Это покажет конкретную ошибку!

