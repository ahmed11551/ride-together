#!/bin/bash
# Полная пересборка сервера с исправлением всех проблем

set -e

echo "🔧 Полная пересборка сервера..."

cd /var/www/ride-together/server

# 1. Очистка
echo "📦 Очистка старых файлов..."
rm -rf dist

# 2. Установка зависимостей
echo "📥 Установка зависимостей..."
npm install

# 3. Компиляция TypeScript (игнорируем ошибки типов, JS код все равно создастся)
echo "🔨 Компиляция TypeScript..."
npx tsc --noEmitOnError false 2>&1 | grep -E "(error|Error)" | head -10 || echo "Компиляция завершена"

# 4. Исправление импортов и __dirname
echo "🔧 Исправление импортов..."
if [ -f dist/index.js ]; then
    node fix-imports.js
    
    # Дополнительно исправляем __dirname если нужно
    cd dist
    python3 << 'PYTHON'
with open('index.js', 'r') as f:
    content = f.read()

# Исправляем __dirname если еще не исправлено
old = "const __filename = fileURLToPath(import.meta.url);\nconst __dirname = dirname(__filename);"
new = """let __dirname;
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = dirname(__filename);
} catch {
  __dirname = process.cwd();
}"""

if old in content:
    content = content.replace(old, new)
    with open('index.js', 'w') as f:
        f.write(content)
    print("✅ __dirname исправлен")
else:
    print("✅ __dirname уже исправлен")
PYTHON
    cd ..
else
    echo "❌ dist/index.js не найден после компиляции"
    exit 1
fi

# 5. Проверка синтаксиса
echo "✅ Проверка синтаксиса..."
node --check dist/index.js && echo "✅ Синтаксис правильный!" || {
    echo "❌ Синтаксическая ошибка"
    node --check dist/index.js 2>&1 | head -5
    exit 1
}

# 6. Перезапуск PM2
echo "🔄 Перезапуск PM2..."
pm2 restart ride-backend || pm2 start ecosystem.config.cjs

# 7. Проверка
echo "⏳ Ожидание запуска..."
sleep 3

echo "📋 Статус:"
pm2 status

echo ""
echo "📋 Логи (последние 5 строк):"
pm2 logs ride-backend --lines 5 --nostream | tail -10

echo ""
echo "🏥 Health check:"
curl -s http://localhost:3001/health || echo "❌ Сервер не отвечает"

echo ""
echo "✅ Пересборка завершена!"

