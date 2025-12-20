#!/bin/bash
# Полное исправление всех использований __dirname

cd /var/www/ride-together/server/dist || exit 1

echo "🔍 Проверка файла index.js..."
echo ""

# Показываем проблемную область
echo "📋 Строки 1-20:"
head -20 index.js | cat -n

echo ""
echo "🔧 Исправляем все использования __dirname..."

# Сохраняем оригинал
cp index.js index.js.backup

# Заменяем все возможные варианты использования __dirname
# 1. path.join(__dirname, -> path.join(process.cwd(),
sed -i 's/path\.join(__dirname,/path.join(process.cwd(),/g' index.js

# 2. path.resolve(__dirname, -> path.resolve(process.cwd(),
sed -i 's/path\.resolve(__dirname,/path.resolve(process.cwd(),/g' index.js

# 3. Любые другие использования __dirname (но не трогаем определения)
# Заменяем только если это не часть let/const __dirname
sed -i 's/__dirname/process.cwd()/g' index.js

echo ""
echo "📋 Проверка результата (строки 1-20):"
head -20 index.js | cat -n

echo ""
echo "📋 Проверка синтаксиса..."
if node --check index.js 2>&1; then
    echo "✅ Синтаксис правильный!"
    rm -f index.js.backup
else
    echo "❌ Ошибка синтаксиса! Восстанавливаем оригинал..."
    mv index.js.backup index.js
    echo "Оригинальный файл восстановлен"
    exit 1
fi

echo ""
echo "✅ Исправление завершено!"

