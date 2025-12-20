#!/bin/bash
# Исправление ошибки new URL(req.url)

cd /var/www/ride-together/server

echo "🔧 Исправление new URL(req.url)..."
echo ""

# Заменяем использование new URL(req.url) на прямое использование req.query
# Это нужно сделать вручную, так как нужно удалить несколько строк

cd dist/api/rides

# Создаём исправленную версию
python3 << 'PYTHON'
with open('list.js', 'r') as f:
    lines = f.readlines()

# Находим строку с new URL
new_lines = []
skip_next = False
i = 0
while i < len(lines):
    line = lines[i]
    
    # Если это строка с new URL - пропускаем её и следующие строки с url.searchParams
    if 'const url = new URL(req.url);' in line:
        # Пропускаем эту строку
        skip_next = True
        i += 1
        continue
    
    # Если это использование url.searchParams - заменяем на req.query
    if skip_next and 'url.searchParams.get' in line:
        # Извлекаем параметр
        if "from" in line:
            new_lines.append("        const from = req.query.from;\n")
        elif "to" in line:
            new_lines.append("        const to = req.query.to;\n")
        elif "date" in line:
            new_lines.append("        const date = req.query.date;\n")
        elif "passengers" in line:
            new_lines.append("        const passengers = parseInt(req.query.passengers || '1');\n")
        elif "page" in line and "pageSize" not in lines[i+1] if i+1 < len(lines) else True:
            new_lines.append("        const page = parseInt(req.query.page || '0');\n")
        elif "pageSize" in line:
            new_lines.append("        const pageSize = parseInt(req.query.pageSize || '0');\n")
        elif "limit" in line:
            new_lines.append("        const limit = pageSize > 0 ? pageSize : parseInt(req.query.limit || '50');\n")
        elif "offset" in line:
            new_lines.append("        const offset = page > 0 && pageSize > 0 ? (page - 1) * pageSize : parseInt(req.query.offset || '0');\n")
        elif "status" in line:
            new_lines.append("        const status = req.query.status || 'active';\n")
        elif "sortBy" in line:
            new_lines.append("        const sortBy = req.query.sortBy || 'departure';\n")
        elif "includePagination" in line:
            new_lines.append("        const includePagination = req.query.includePagination === 'true' || (page > 0 && pageSize > 0);\n")
        else:
            # Оставляем как есть, но без url.
            new_lines.append(line.replace('url.searchParams.get', 'req.query'))
        i += 1
        continue
    
    # Если больше нет url.searchParams - сбрасываем флаг
    if skip_next and 'url.searchParams' not in line:
        skip_next = False
    
    new_lines.append(line)
    i += 1

with open('list.js', 'w') as f:
    f.writelines(new_lines)

print("✅ Исправлено")
PYTHON

cd ../../..

echo ""
echo "🔍 Проверка что исправлено:"
grep -n "new URL\|url.searchParams" dist/api/rides/list.js | head -5 || echo "✅ Не найдено (исправлено)"

echo ""
echo "🔄 Перезапуск PM2..."
pm2 restart ride-backend --update-env
sleep 3

echo ""
echo "📦 Тест API:"
curl -s "http://localhost:3001/api/rides?limit=1" | head -c 300
echo ""

