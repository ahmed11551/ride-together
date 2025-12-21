#!/bin/bash

# Полное исправление ошибки ERR_INVALID_URL
# Выполнить на сервере: bash FIX_URL_ERROR_COMPLETE.sh

cd /var/www/ride-together/server

echo "🔧 Исправление ERR_INVALID_URL в dist/api/rides/list.js..."

# Проверяем что файл существует
if [ ! -f "dist/api/rides/list.js" ]; then
    echo "❌ Файл dist/api/rides/list.js не найден!"
    exit 1
fi

# Создаем бэкап
cp dist/api/rides/list.js dist/api/rides/list.js.backup

# Исправляем через Python (более надежно)
python3 << 'PYEOF'
import re
import sys

filepath = 'dist/api/rides/list.js'
try:
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    i = 0
    modified = False
    
    while i < len(lines):
        line = lines[i]
        
        # Пропускаем строки с new URL(req.url)
        if re.search(r'new\s+URL\s*\(\s*req\.url\s*\)', line):
            print(f"Удаляем строку {i+1}: {line.strip()}")
            i += 1
            modified = True
            continue
        
        # Заменяем url.searchParams.get('param') на req.query.param
        if 'url.searchParams.get' in line:
            # Заменяем url.searchParams.get('limit') на req.query.limit
            line = re.sub(r"url\.searchParams\.get\(['\"]limit['\"]\)", "req.query.limit", line)
            line = re.sub(r"url\.searchParams\.get\(['\"]status['\"]\)", "req.query.status", line)
            line = re.sub(r"url\.searchParams\.get\(['\"]from['\"]\)", "req.query.from", line)
            line = re.sub(r"url\.searchParams\.get\(['\"]to['\"]\)", "req.query.to", line)
            line = re.sub(r"url\.searchParams\.get\(['\"]date['\"]\)", "req.query.date", line)
            line = re.sub(r"url\.searchParams\.get\(['\"]passengers['\"]\)", "req.query.passengers", line)
            line = re.sub(r"url\.searchParams\.get\(['\"]page['\"]\)", "req.query.page", line)
            line = re.sub(r"url\.searchParams\.get\(['\"]pageSize['\"]\)", "req.query.pageSize", line)
            line = re.sub(r"url\.searchParams\.get\(['\"]offset['\"]\)", "req.query.offset", line)
            line = re.sub(r"url\.searchParams\.get\(['\"]sortBy['\"]\)", "req.query.sortBy", line)
            
            # Общий паттерн для остальных параметров
            line = re.sub(r"url\.searchParams\.get\(['\"](\w+)['\"]\)", r"req.query.\1", line)
            line = re.sub(r'url\.searchParams\.get\([\'"](\w+)[\'"]\)', r"req.query.\1", line)
            
            # Заменяем другие использования searchParams
            line = re.sub(r'url\.searchParams', 'req.query', line)
            
            if line != lines[i]:
                print(f"Исправляем строку {i+1}")
                modified = True
        
        new_lines.append(line)
        i += 1
    
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"✅ Файл {filepath} исправлен")
    else:
        print("⚠️  Изменения не требуются")
        
except Exception as e:
    print(f"❌ Ошибка: {e}")
    sys.exit(1)
PYEOF

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

