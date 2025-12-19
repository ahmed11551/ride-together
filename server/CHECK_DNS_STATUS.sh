#!/bin/bash
# Скрипт для проверки статуса DNS

echo "=== ПРОВЕРКА DNS ДЛЯ ridetogether.ru ==="
echo ""

echo "📋 Текущий публичный IP сервера должен быть:"
echo "   194.67.124.123"
echo ""

echo "Проверка с разных DNS серверов:"
echo ""

echo "1. Google DNS (8.8.8.8):"
dig ridetogether.ru @8.8.8.8 +short
echo ""

echo "2. Cloudflare DNS (1.1.1.1):"
dig ridetogether.ru @1.1.1.1 +short
echo ""

echo "3. Yandex DNS (77.88.8.8):"
dig ridetogether.ru @77.88.8.8 +short
echo ""

echo "4. REG.RU DNS (ns1.reg.ru):"
dig ridetogether.ru @ns1.reg.ru +short
echo ""

echo "=== ПРОВЕРКА ПОДДОМЕНОВ ==="
echo ""

echo "www.ridetogether.ru:"
dig www.ridetogether.ru @8.8.8.8 +short
echo ""

echo "api.ridetogether.ru:"
dig api.ridetogether.ru @8.8.8.8 +short
echo ""

echo "=== ПРОВЕРКА DNS-СЕРВЕРОВ ==="
echo ""

echo "NS записи для ridetogether.ru:"
dig NS ridetogether.ru @8.8.8.8 +short
echo ""

echo "=== РЕЗУЛЬТАТ ==="
echo ""

MAIN_IP=$(dig ridetogether.ru @8.8.8.8 +short | head -1)
API_IP=$(dig api.ridetogether.ru @8.8.8.8 +short | head -1)
WWW_IP=$(dig www.ridetogether.ru @8.8.8.8 +short | head -1)

if [ "$MAIN_IP" = "194.67.124.123" ] && [ "$API_IP" = "194.67.124.123" ] && [ "$WWW_IP" = "194.67.124.123" ]; then
    echo "✅ ВСЁ ГОТОВО! DNS обновились!"
    echo "   Теперь можно получить SSL сертификат:"
    echo "   certbot --nginx -d api.ridetogether.ru -d ridetogether.ru -d www.ridetogether.ru"
else
    echo "⚠️ DNS еще не обновились или настроены неправильно"
    echo ""
    echo "Проверьте в REG.RU:"
    echo "  - A @ → 194.67.124.123"
    echo "  - A www → 194.67.124.123"
    echo "  - A api → 194.67.124.123"
    echo ""
    echo "Текущие значения:"
    echo "  ridetogether.ru → $MAIN_IP"
    echo "  www.ridetogether.ru → $WWW_IP"
    echo "  api.ridetogether.ru → $API_IP"
fi

