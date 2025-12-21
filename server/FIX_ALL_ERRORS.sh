#!/bin/bash

# Полное исправление всех ошибок в dist файлах

cd /var/www/ride-together/server

echo "🔍 Шаг 1: Исправление __dirname..."

# Исправить __dirname
python3 << 'PYEOF'
import re
with open('dist/index.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

filtered = []
i = 0
while i < len(lines):
    line = lines[i]
    if '__filename = fileURLToPath' in line or '__dirname = dirname' in line:
        i += 1
        if i < len(lines) and '__dirname = dirname' in lines[i]:
            i += 1
        continue
    filtered.append(line)
    i += 1

content = ''.join(filtered)
content = content.replace('path.join(__dirname', 'path.join(process.cwd()')
content = content.replace('__dirname', 'process.cwd()')

with open('dist/index.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("✅ __dirname исправлен")
PYEOF

echo ""
echo "🔍 Шаг 2: Исправление new URL()..."

# Исправить new URL
find dist -name "*.js" -type f -exec python3 -c "
import re
import sys
with open(sys.argv[1], 'r', encoding='utf-8') as f:
    content = f.read()
original = content
content = re.sub(r'const\s+url\s*=\s*new\s+URL\(req\.url\);?\s*\n', '', content)
content = re.sub(r'let\s+url\s*=\s*new\s+URL\(req\.url\);?\s*\n', '', content)
content = re.sub(r\"url\.searchParams\.get\('([^']+)'\)\", r'req.query.\1', content)
content = re.sub(r'url\.searchParams\.get\(', 'req.query.', content)
content = re.sub(r'url\.searchParams', 'req.query', content)
if content != original:
    with open(sys.argv[1], 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'✅ Исправлено: {sys.argv[1]}')
" {} \;

echo ""
echo "🔍 Шаг 3: Исправление req.headers.get..."

# Исправить req.headers.get
find dist -name "*.js" -type f -exec sed -i 's/req\.headers\.get(/req.get(/g' {} \;
find dist -name "*.js" -type f -exec sed -i 's/headers\.get(/req.get(/g' {} \;

echo ""
echo "🔄 Перезапуск PM2..."
pm2 restart ride-backend

echo ""
echo "⏳ Ожидание 3 секунды..."
sleep 3

echo ""
echo "📋 Проверка логов..."
pm2 logs ride-backend --err --lines 15 --nostream

