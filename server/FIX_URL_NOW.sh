#!/bin/bash

# СРОЧНОЕ исправление ERR_INVALID_URL
# Выполнить на сервере: bash FIX_URL_NOW.sh

cd /var/www/ride-together/server

echo "🔧 Исправляем ERR_INVALID_URL в dist/api/rides/list.js..."

# Проверяем что файл существует
if [ ! -f "dist/api/rides/list.js" ]; then
    echo "❌ Файл dist/api/rides/list.js не найден!"
    exit 1
fi

# Создаем бэкап
cp dist/api/rides/list.js dist/api/rides/list.js.backup

# Исправляем через Python
python3 << 'PYEOF'
import re

filepath = 'dist/api/rides/list.js'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
modified = False

for i, line in enumerate(lines, 1):
    # Пропускаем строки с new URL(req.url) - это строка 12
    if 'new URL' in line and ('req.url' in line or 'req.url' in line):
        print(f"Удаляем строку {i}: {line.strip()[:80]}")
        modified = True
        continue
    
    # Заменяем url.searchParams на req.query
    if 'url.searchParams' in line:
        print(f"Исправляем строку {i}: {line.strip()[:80]}")
        # Заменяем все варианты
        line = line.replace('url.searchParams.get', 'req.query')
        line = line.replace('url.searchParams', 'req.query')
        # Убираем .get( и заменяем на прямую точку
        line = re.sub(r"req\.query\(['\"](\w+)['\"]\)", r"req.query.\1", line)
        line = re.sub(r'req\.query\(["\'](\w+)["\']\)', r"req.query.\1", line)
        modified = True
    
    new_lines.append(line)

if modified:
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f"✅ Файл {filepath} исправлен")
else:
    print("⚠️  Изменения не требуются")
    # Показываем проблемные строки
    print("\n📋 Показываем строки вокруг 12:")
    for i in range(max(0, 8), min(len(lines), 18)):
        marker = " >>>" if i == 11 else "    "
        print(f"{i+1:3d}{marker} {lines[i].rstrip()}")
PYEOF

echo ""
echo "🔄 Перезапускаем PM2..."
pm2 restart ride-backend

echo ""
echo "⏳ Ждём 3 секунды..."
sleep 3

echo ""
echo "📋 Проверяем логи..."
pm2 logs ride-backend --err --lines 10 --nostream

echo ""
echo "✅ Готово!"
