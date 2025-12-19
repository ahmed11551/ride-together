#!/bin/bash
# Проверка DNS записей для ridetogether.ru

echo "🔍 Проверка DNS записей..."
echo ""

echo "=== Проверка api.ridetogether.ru ==="
nslookup api.ridetogether.ru || dig api.ridetogether.ru +short

echo ""
echo "=== Проверка ridetogether.ru ==="
nslookup ridetogether.ru || dig ridetogether.ru +short

echo ""
echo "=== Проверка www.ridetogether.ru ==="
nslookup www.ridetogether.ru || dig www.ridetogether.ru +short

echo ""
echo "=== Проверка доступности домена ==="
echo "Проверка HTTP ответа:"
curl -I http://ridetogether.ru 2>&1 | head -5 || echo "❌ Домен не отвечает"

echo ""
echo "=== Проверка с сервера ==="
ping -c 2 ridetogether.ru 2>&1 || echo "❌ Пинг не проходит"

