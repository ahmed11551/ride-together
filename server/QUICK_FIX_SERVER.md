# Быстрое исправление сервера

## Проблема:
- Сервер показывает "Server running", но health check не работает
- В логах ошибок старые ошибки про `__dirname`

## Решение (выполните на сервере):

### Вариант 1: Автоматическое исправление
```bash
cd /var/www/ride-together/server

# Скачайте и выполните скрипт
curl -o fix-now.sh https://raw.githubusercontent.com/your-repo/fix.sh || cat > fix-now.sh << 'EOFSCRIPT'
#!/bin/bash
set -e
cd /var/www/ride-together/server

echo "🛑 Остановка..."
pm2 stop ride-backend || true
pm2 delete ride-backend || true
sleep 2

echo "🔍 Проверка порта..."
PID=$(ss -tlnp | grep ":3001 " | grep -oP 'pid=\K\d+' | head -1)
if [ ! -z "$PID" ]; then
    kill -9 $PID 2>/dev/null || true
    sleep 1
fi

echo "🧹 Очистка..."
pm2 flush || true

echo "🔨 Пересборка..."
rm -rf dist
npm install
npx tsc --noEmitOnError false 2>&1 | tail -5 || true

echo "🔧 Исправление импортов..."
if [ -f fix-imports.js ]; then
    node fix-imports.js || true
fi

echo "🔧 Исправление __dirname в dist/index.js..."
cd dist
python3 << 'PYTHON'
with open('index.js', 'r') as f:
    content = f.read()

# Заменяем path.join(__dirname, на path.join(process.cwd(),
import re
content = re.sub(r'path\.join\(__dirname,', r'path.join(process.cwd(),', content)

# Также заменяем использование __dirname для .env файлов если есть
with open('index.js', 'w') as f:
    f.write(content)
print("✅ Исправлено")
PYTHON
cd ..

echo "✅ Проверка синтаксиса..."
node --check dist/index.js && echo "✅ OK" || echo "⚠️ Есть ошибки"

echo "🚀 Запуск..."
pm2 start ecosystem.config.cjs

echo "⏳ Ожидание..."
sleep 5

echo "🏥 Health check:"
curl -s http://localhost:3001/health && echo "" || echo "❌ Не работает"

echo "📊 Статус:"
pm2 status
EOFSCRIPT

chmod +x fix-now.sh
./fix-now.sh
```

### Вариант 2: Ручное исправление

```bash
cd /var/www/ride-together/server

# 1. Остановить
pm2 stop ride-backend
pm2 delete ride-backend

# 2. Убить процесс на порту 3001 (если есть)
ss -tlnp | grep ":3001 " | grep -oP 'pid=\K\d+' | xargs kill -9 2>/dev/null || true

# 3. Пересобрать
rm -rf dist
npm run build

# 4. Исправить __dirname в dist/index.js
cd dist
sed -i 's/path\.join(__dirname,/path.join(process.cwd(),/g' index.js
cd ..

# 5. Проверить
node --check dist/index.js

# 6. Запустить
pm2 start ecosystem.config.cjs

# 7. Проверить
sleep 3
curl http://localhost:3001/health
pm2 status
pm2 logs ride-backend --lines 10 --nostream
```

### Вариант 3: Простое исправление __dirname

Если сервер работает, но только health check не проходит:

```bash
cd /var/www/ride-together/server/dist

# Исправить __dirname
python3 << 'PYTHON'
with open('index.js', 'r') as f:
    content = f.read()

# Заменяем все path.join(__dirname, на path.join(process.cwd(),
content = content.replace('path.join(__dirname,', 'path.join(process.cwd(),')

with open('index.js', 'w') as f:
    f.write(content)
print("✅ Исправлено")
PYTHON

# Перезапустить
pm2 restart ride-backend

# Проверить
sleep 3
curl http://localhost:3001/health
```

## Проверка после исправления:

```bash
# 1. Health check
curl http://localhost:3001/health

# 2. Статус PM2
pm2 status

# 3. Логи
pm2 logs ride-backend --lines 20 --nostream

# 4. Проверка порта
ss -tlnp | grep 3001
```

## Если не помогло:

```bash
# Полная диагностика
cd /var/www/ride-together/server

# Проверить файл
head -30 dist/index.js

# Проверить переменные окружения
pm2 env 0

# Проверить процессы
ps aux | grep node

# Проверить порты
netstat -tlnp 2>/dev/null | grep 3001 || ss -tlnp | grep 3001
```

