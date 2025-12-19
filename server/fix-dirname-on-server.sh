#!/bin/bash
# Быстрое исправление __dirname на сервере

cd /var/www/ride-together/server/dist

echo "🔧 Исправление __dirname в dist/index.js..."

# Используем sed для замены
sed -i 's/const __filename = fileURLToPath(import\.meta\.url);/let __dirname;\ntry {\n  const __filename = fileURLToPath(import.meta.url);\n  __dirname = dirname(__filename);\n} catch {\n  __dirname = process.cwd();\n}/' index.js

# Или через Python (более надежно)
python3 << 'PYTHON'
import re

with open('index.js', 'r') as f:
    content = f.read()

# Ищем и заменяем проблемный блок
pattern = r'const __filename = fileURLToPath\(import\.meta\.url\);\s*const __dirname = dirname\(__filename\);'

replacement = '''let __dirname;
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = dirname(__filename);
} catch {
  __dirname = process.cwd();
}'''

if re.search(pattern, content):
    content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    with open('index.js', 'w') as f:
        f.write(content)
    print("✅ __dirname исправлен!")
else:
    print("⚠️  Паттерн не найден, проверяем содержимое...")
    # Показываем первые 15 строк
    lines = content.split('\n')[:15]
    for i, line in enumerate(lines, 1):
        print(f"{i}: {line}")
PYTHON

echo ""
echo "✅ Проверка синтаксиса..."
node --check index.js && echo "✅ Синтаксис правильный!" || echo "❌ Ошибка синтаксиса"

echo ""
echo "🔄 Перезапуск PM2..."
cd /var/www/ride-together/server
pm2 restart ride-backend

sleep 3

echo ""
echo "📋 Статус:"
pm2 status

echo ""
echo "📋 Логи ошибок (последние 3 строки):"
pm2 logs ride-backend --err --lines 3 --nostream
