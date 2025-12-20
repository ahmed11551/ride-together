#!/bin/bash
# Проверка локальной базы данных на сервере

echo "🔍 Проверка локальной базы данных..."
echo ""

# 1. Проверка установлен ли PostgreSQL
echo "1️⃣  Проверка PostgreSQL:"
which psql || echo "⚠️  psql не найден"

systemctl status postgresql --no-pager 2>/dev/null | head -5 || echo "⚠️  PostgreSQL не запущен или не установлен"

echo ""
echo "2️⃣  Проверка запущенных процессов PostgreSQL:"
ps aux | grep postgres | grep -v grep | head -3 || echo "⚠️  Процессы PostgreSQL не найдены"

echo ""
echo "3️⃣  Проверка порта 5432:"
ss -tlnp | grep 5432 || echo "⚠️  Порт 5432 не слушается"

echo ""
echo "4️⃣  Попытка подключения к локальной БД:"
if command -v psql &> /dev/null; then
    sudo -u postgres psql -c "SELECT version();" 2>&1 | head -5 || echo "⚠️  Не удалось подключиться"
    
    echo ""
    echo "5️⃣  Список баз данных:"
    sudo -u postgres psql -l 2>&1 | head -10
else
    echo "⚠️  psql не установлен"
fi

echo ""
echo "6️⃣  Проверка переменных окружения:"
grep -i "database\|postgres\|db" /var/www/ride-together/server/.env* 2>/dev/null | head -5 || echo "⚠️  .env файлы не найдены"

