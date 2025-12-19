#!/bin/bash
# Прямое исправление __dirname - проверяем что там и исправляем вручную

cd /var/www/ride-together/server/dist

echo "=== Что на строке 10 ==="
sed -n '10p' index.js

echo ""
echo "=== Первые 20 строк ==="
head -20 index.js

echo ""
echo "=== Ищем __dirname ==="
grep -n "__dirname\|__filename" index.js | head -5

echo ""
echo "=== Исправляем через sed (надежный метод) ==="

# Метод 1: Используем awk для построчной замены
awk '
/const __filename = fileURLToPath\(import\.meta\.url\)/ {
    print "let __dirname;"
    print "try {"
    print "  const __filename = fileURLToPath(import.meta.url);"
    print "  __dirname = dirname(__filename);"
    print "} catch {"
    print "  __dirname = process.cwd();"
    print "}"
    next
}
/const __dirname = dirname\(__filename\)/ {
    next
}
{
    print
}
' index.js > index.js.tmp && mv index.js.tmp index.js

echo "✅ Замена выполнена"

echo ""
echo "=== Проверяем результат (строки 8-20) ==="
sed -n '8,20p' index.js

echo ""
echo "=== Проверка синтаксиса ==="
node --check index.js && echo "✅ Синтаксис правильный!" || {
    echo "❌ Ошибка, пробуем другой метод..."
    
    # Метод 2: Через Python с более точным поиском
    python3 << 'PYTHON'
with open('index.js', 'r') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Если находим строку с __filename
    if 'const __filename = fileURLToPath(import.meta.url)' in line:
        new_lines.append('let __dirname;\n')
        new_lines.append('try {\n')
        new_lines.append('  const __filename = fileURLToPath(import.meta.url);\n')
        new_lines.append('  __dirname = dirname(__filename);\n')
        new_lines.append('} catch {\n')
        new_lines.append('  __dirname = process.cwd();\n')
        new_lines.append('}\n')
        i += 1
        # Пропускаем следующую строку если она __dirname
        if i < len(lines) and 'const __dirname = dirname(__filename)' in lines[i]:
            i += 1
        continue
    
    new_lines.append(line)
    i += 1

with open('index.js', 'w') as f:
    f.writelines(new_lines)

print("✅ Исправлено через Python")
PYTHON
}

echo ""
echo "=== Финальная проверка ==="
node --check index.js && echo "✅✅✅ СИНТАКСИС ПРАВИЛЬНЫЙ!" || {
    echo "❌❌❌ Все еще ошибка!"
    echo "Показываем строки вокруг ошибки:"
    sed -n '8,15p' index.js
    exit 1
}

echo ""
echo "🔄 Перезапуск PM2..."
cd /var/www/ride-together/server
pm2 restart ride-backend

sleep 4

echo ""
echo "📋 Проверка логов ошибок:"
pm2 logs ride-backend --err --lines 3 --nostream

echo ""
echo "📋 Health check:"
curl -s http://localhost:3001/health && echo "" || echo "❌ Сервер не отвечает"

