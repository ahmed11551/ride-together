#!/bin/bash
# Простое исправление new URL(req.url)

cd /var/www/ride-together/server/dist/api/rides

echo "🔧 Исправление new URL(req.url) на req.query..."

# Используем более простой подход - заменяем весь блок
python3 << 'PYTHON'
with open('list.js', 'r') as f:
    content = f.read()

# Заменяем блок с new URL на прямое использование req.query
old_pattern = """        const url = new URL(req.url);
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');
        const date = url.searchParams.get('date');
        const passengers = parseInt(url.searchParams.get('passengers') || '1');
        const status = url.searchParams.get('status') || 'active';
        const page = parseInt(url.searchParams.get('page') || '0');
        const pageSize = parseInt(url.searchParams.get('pageSize') || '0');
        const limit = pageSize > 0 ? pageSize : parseInt(url.searchParams.get('limit') || '50');
        const offset = page > 0 && pageSize > 0 ? (page - 1) * pageSize : parseInt(url.searchParams.get('offset') || '0');
        const includePagination = url.searchParams.get('includePagination') === 'true' || (page > 0 && pageSize > 0);"""

new_code = """        const from = req.query.from;
        const to = req.query.to;
        const date = req.query.date;
        const passengers = parseInt((req.query.passengers || '1').toString());
        const status = (req.query.status || 'active').toString();
        const page = parseInt((req.query.page || '0').toString());
        const pageSize = parseInt((req.query.pageSize || '0').toString());
        const limit = pageSize > 0 ? pageSize : parseInt((req.query.limit || '50').toString());
        const offset = page > 0 && pageSize > 0 ? (page - 1) * pageSize : parseInt((req.query.offset || '0').toString());
        const includePagination = req.query.includePagination === 'true' || (page > 0 && pageSize > 0);"""

if old_pattern in content:
    content = content.replace(old_pattern, new_code)
    with open('list.js', 'w') as f:
        f.write(content)
    print("✅ Исправлено (блок заменён)")
else:
    # Попробуем заменить по частям
    content = content.replace('const url = new URL(req.url);', '')
    content = content.replace("url.searchParams.get('from')", 'req.query.from')
    content = content.replace("url.searchParams.get('to')", 'req.query.to')
    content = content.replace("url.searchParams.get('date')", 'req.query.date')
    content = content.replace("url.searchParams.get('passengers')", '(req.query.passengers || \'1\').toString()')
    content = content.replace("url.searchParams.get('status')", '(req.query.status || \'active\').toString()')
    content = content.replace("url.searchParams.get('page')", '(req.query.page || \'0\').toString()')
    content = content.replace("url.searchParams.get('pageSize')", '(req.query.pageSize || \'0\').toString()')
    content = content.replace("url.searchParams.get('limit')", '(req.query.limit || \'50\').toString()')
    content = content.replace("url.searchParams.get('offset')", '(req.query.offset || \'0\').toString()')
    content = content.replace("url.searchParams.get('includePagination')", 'req.query.includePagination')
    content = content.replace('url.searchParams.get', 'req.query')
    
    with open('list.js', 'w') as f:
        f.write(content)
    print("✅ Исправлено (по частям)")

PYTHON

cd ../../..

echo ""
echo "🔍 Проверка:"
head -20 dist/api/rides/list.js | grep -E "new URL|url.searchParams|req.query" | head -5

echo ""
echo "🔄 Перезапуск..."
pm2 restart ride-backend --update-env
sleep 3

echo ""
echo "📦 Тест:"
curl -s "http://localhost:3001/api/rides?limit=1" | head -c 300
echo ""

