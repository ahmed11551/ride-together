#!/bin/bash

# Пересборка и исправление ошибки ERR_INVALID_URL
# Выполнить на сервере: bash REBUILD_AND_FIX.sh

cd /var/www/ride-together/server

echo "🔧 Пересборка проекта и исправление ошибок..."

# 1. Останавливаем PM2
echo "⏸️  Останавливаем PM2..."
pm2 stop ride-backend || true

# 2. Пересобираем проект
echo "📦 Пересобираем проект..."
npm run build 2>&1 | tail -30

# 3. Исправляем импорты (если есть скрипт)
if [ -f "fix-imports.js" ]; then
    echo "🔧 Исправляем импорты..."
    node fix-imports.js
fi

# 4. Исправляем __dirname
echo "🔧 Исправляем __dirname..."
python3 << 'PYEOF'
import re

filepath = 'dist/index.js'
try:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Заменяем path.join(__dirname на path.join(process.cwd()
    content = re.sub(r'path\.join\(__dirname', 'path.join(process.cwd()', content)
    
    # Удаляем определения __dirname если есть
    content = re.sub(r'const\s+__filename\s*=\s*fileURLToPath\(import\.meta\.url\);?\s*\n', '', content)
    content = re.sub(r'const\s+__dirname\s*=\s*dirname\(__filename\);?\s*\n', '', content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    print("✅ __dirname исправлен")
except Exception as e:
    print(f"⚠️  Ошибка: {e}")
PYEOF

# 5. Исправляем new URL в rides/list.js
echo "🔧 Исправляем new URL в API файлах..."
find dist/api -name "*.js" -type f -exec python3 << 'PYEOF'
import re, sys

filepath = sys.argv[1]
try:
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    modified = False
    
    for line in lines:
        # Пропускаем строки с new URL(req.url)
        if 'new URL' in line and 'req.url' in line:
            modified = True
            continue
        
        # Заменяем url.searchParams на req.query
        if 'url.searchParams' in line:
            line = re.sub(r"url\.searchParams\.get\(['\"](\w+)['\"]\)", r'req.query.\1', line)
            line = line.replace('url.searchParams', 'req.query')
            modified = True
        
        new_lines.append(line)
    
    if modified:
        with open(filepath, 'w') as f:
            f.writelines(new_lines)
        print(f"✅ Исправлен: {filepath}")
except:
    pass
PYEOF
{} \;

# 6. Исправляем req.headers.get на req.get
echo "🔧 Исправляем req.headers.get..."
find dist/api -name "*.js" -type f -exec sed -i 's/req\.headers\.get(/req.get(/g' {} \;
find dist/api -name "*.js" -type f -exec sed -i 's/headers\.get(/req.get(/g' {} \;

# 7. Запускаем PM2
echo "🚀 Запускаем PM2..."
pm2 restart ride-backend --update-env

echo ""
echo "⏳ Ждём 3 секунды..."
sleep 3

echo ""
echo "📋 Проверяем логи..."
pm2 logs ride-backend --err --lines 15 --nostream

echo ""
echo "✅ Готово!"

