#!/bin/bash

# Исправление ошибки ERR_INVALID_URL на сервере
# Выполнить на сервере: bash FIX_URL_ERROR.sh

cd /var/www/ride-together/server

echo "🔧 Исправление ошибки ERR_INVALID_URL..."

# Исправляем все файлы в dist/api/rides
find dist/api/rides -name "*.js" -type f -exec python3 << 'PYEOF'
import re
import sys

filepath = sys.argv[1]
try:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Удаляем строки с new URL(req.url)
    content = re.sub(r'const\s+url\s*=\s*new\s+URL\(req\.url\);?\s*\n', '', content)
    content = re.sub(r'let\s+url\s*=\s*new\s+URL\(req\.url\);?\s*\n', '', content)
    content = re.sub(r'var\s+url\s*=\s*new\s+URL\(req\.url\);?\s*\n', '', content)
    
    # Заменяем url.searchParams.get('param') на req.query.param
    content = re.sub(r"url\.searchParams\.get\(['\"](\w+)['\"]\)", r"req.query.\1", content)
    content = re.sub(r'url\.searchParams\.get\([\'"](\w+)[\'"]\)', r"req.query.\1", content)
    
    # Заменяем остальные использования searchParams
    content = re.sub(r'url\.searchParams', 'req.query', content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Исправлено: {filepath}")
except Exception as e:
    print(f"❌ Ошибка в {filepath}: {e}")
PYEOF
{} \;

echo ""
echo "✅ Исправление завершено"
echo ""
echo "🔄 Перезапускаем PM2..."
pm2 restart ride-backend

echo ""
echo "⏳ Ждём 3 секунды..."
sleep 3

echo ""
echo "📋 Проверяем логи..."
pm2 logs ride-backend --err --lines 10 --nostream
