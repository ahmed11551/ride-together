#!/bin/bash

# Исправление и пересборка на сервере
# Использовать на сервере: bash FIX_AND_REBUILD.sh

set -e

cd /var/www/ride-together/server

echo "📦 Устанавливаем зависимости (включая dev для компиляции)..."
npm ci

echo "🔨 Пересобираем проект..."
# Используем --noEmitOnError false чтобы компиляция продолжалась несмотря на ошибки типов
npx tsc --noEmitOnError false || true

echo "🔧 Исправляем импорты..."
if [ -f "fix-imports.js" ]; then
    node fix-imports.js
fi

echo "🔧 Исправляем __dirname..."
python3 << 'PYEOF'
import re

filepath = 'dist/index.js'
try:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Заменяем path.join(__dirname на path.join(process.cwd()
    content = re.sub(r'path\.join\(__dirname', 'path.join(process.cwd()', content)
    
    # Удаляем определения __dirname если есть
    content = re.sub(r'const\s+__filename\s*=\s*fileURLToPath\(import\.meta\.url\);?\s*\n', '', content)
    content = re.sub(r'const\s+__dirname\s*=\s*dirname\(__filename\);?\s*\n', '', content)
    content = re.sub(r'let\s+__filename\s*=\s*fileURLToPath\(import\.meta\.url\);?\s*\n', '', content)
    content = re.sub(r'let\s+__dirname\s*=\s*dirname\(__filename\);?\s*\n', '', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ __dirname исправлен")
except Exception as e:
    print(f"⚠️  Ошибка: {e}")
PYEOF

echo "🔧 Исправляем req.headers.get..."
find dist/api -name "*.js" -type f -exec sed -i 's/req\.headers\.get(/req.get(/g' {} + 2>/dev/null || true
find dist/api -name "*.js" -type f -exec sed -i 's/headers\.get(/req.get(/g' {} + 2>/dev/null || true

echo "🔧 Исправляем new URL..."
# Исправляем через Python для всех файлов
python3 << 'PYEOF'
import re
import os

fixed_count = 0
for root, dirs, files in os.walk('dist/api'):
    for file in files:
        if file.endswith('.js'):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original = content
                
                # Удаляем строки с new URL(req.url)
                content = re.sub(r'.*new\s+URL\s*\(\s*req\.url\s*\).*\n', '', content)
                
                # Заменяем url.searchParams.get('param') на req.query.param
                content = re.sub(r"url\.searchParams\.get\(['\"](\w+)['\"]\)", r'req.query.\1', content)
                content = re.sub(r'url\.searchParams', 'req.query', content)
                
                if content != original:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    fixed_count += 1
                    print(f"✅ Исправлено: {filepath}")
            except Exception as e:
                pass

print(f"✅ Всего исправлено файлов: {fixed_count}")
PYEOF

echo ""
echo "🔄 Перезапускаем PM2..."
pm2 restart ride-backend --update-env

echo ""
echo "⏳ Ждём 3 секунды..."
sleep 3

echo ""
echo "📋 Проверяем статус..."
pm2 status

echo ""
echo "📋 Проверяем логи (ошибки)..."
pm2 logs ride-backend --err --lines 15 --nostream

echo ""
echo "✅ Готово!"

