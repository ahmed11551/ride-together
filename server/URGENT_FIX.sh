#!/bin/bash
# СРОЧНОЕ ИСПРАВЛЕНИЕ - проверяем что там и исправляем точно

cd /var/www/ride-together/server/dist

echo "=== ВАЖНО: Показываем строки 1-15 ==="
sed -n '1,15p' index.js
echo ""

# Метод: читаем весь файл и исправляем через Python построчно
python3 << 'ENDPYTHON'
import sys

with open('index.js', 'r') as f:
    lines = f.readlines()

print(f"Всего строк: {len(lines)}")
print("\n=== Строки 8-15 ===")
for i in range(7, min(15, len(lines))):
    print(f"{i+1}: {lines[i].rstrip()}")

# Ищем проблемную строку
new_lines = []
i = 0
found = False

while i < len(lines):
    line = lines[i]
    
    # Ищем строку с const __filename
    if 'const __filename = fileURLToPath(import.meta.url)' in line:
        print(f"\n✅ Найдена проблемная строка {i+1}: {line.rstrip()}")
        found = True
        
        # Добавляем исправленный код
        new_lines.append('let __dirname;\n')
        new_lines.append('try {\n')
        new_lines.append('  const __filename = fileURLToPath(import.meta.url);\n')
        new_lines.append('  __dirname = dirname(__filename);\n')
        new_lines.append('} catch {\n')
        new_lines.append('  __dirname = process.cwd();\n')
        new_lines.append('}\n')
        
        i += 1
        # Пропускаем следующую строку если она тоже про __dirname
        if i < len(lines) and 'const __dirname = dirname(__filename)' in lines[i]:
            print(f"⏭️  Пропускаем строку {i+1}: {lines[i].rstrip()}")
            i += 1
        continue
    
    new_lines.append(line)
    i += 1

if not found:
    print("\n❌ Не найдена строка с __filename!")
    print("Ищем все строки с __dirname или __filename:")
    for i, line in enumerate(lines[:30], 1):
        if '__dirname' in line or '__filename' in line:
            print(f"{i}: {line.rstrip()}")
    sys.exit(1)

# Сохраняем исправленный файл
with open('index.js', 'w') as f:
    f.writelines(new_lines)

print("\n✅ Файл исправлен!")

# Показываем что получилось
print("\n=== После исправления (строки 8-20) ===")
with open('index.js', 'r') as f:
    fixed_lines = f.readlines()
    for i in range(7, min(20, len(fixed_lines))):
        print(f"{i+1}: {fixed_lines[i].rstrip()}")
ENDPYTHON

echo ""
echo "=== Проверка синтаксиса ==="
node --check index.js && echo "✅✅✅ СИНТАКСИС ПРАВИЛЬНЫЙ!" || {
    echo "❌❌❌ ВСЕ ЕЩЕ ОШИБКА!"
    echo "Показываем первые 20 строк:"
    head -20 index.js
    exit 1
}

echo ""
echo "🔄 Перезапуск PM2..."
cd /var/www/ride-together/server
pm2 restart ride-backend

sleep 5

echo ""
echo "📋 Логи ошибок:"
pm2 logs ride-backend --err --lines 5 --nostream

echo ""
echo "📋 Логи успешного запуска:"
pm2 logs ride-backend --out --lines 5 --nostream | tail -5

echo ""
echo "📋 Health check:"
curl -s http://localhost:3001/health && echo -e "\n✅ СЕРВЕР РАБОТАЕТ!" || echo "❌ Сервер не отвечает"

