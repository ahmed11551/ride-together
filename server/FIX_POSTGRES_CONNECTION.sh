#!/bin/bash
# Исправление проблемы с подключением к PostgreSQL

echo "🔧 Исправление подключения к PostgreSQL..."

# Проблема: peer authentication failed
# Решение: использовать -h localhost для подключения через TCP вместо socket

# Проверяем, какая команда работает
echo ""
echo "Попробуйте использовать один из вариантов:"
echo ""
echo "Вариант 1 (через TCP):"
echo "psql -h localhost -U ride_user -d ride_together -f migrations/add_notifications_table.sql"
echo ""
echo "Вариант 2 (с указанием пароля через переменную):"
echo "PGPASSWORD=your_password psql -h localhost -U ride_user -d ride_together -f migrations/add_notifications_table.sql"
echo ""
echo "Вариант 3 (интерактивный ввод пароля):"
echo "psql -h localhost -U ride_user -d ride_together"
echo ""

