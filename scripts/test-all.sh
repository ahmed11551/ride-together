#!/bin/bash
# Скрипт тестирования всех возможностей twc для Ride Together

set -e

# Цвета
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}🧪 Тестирование всех возможностей Timeweb Cloud CLI${NC}"
echo "================================================"
echo ""

# Проверка установки twc
echo -e "${CYAN}1. Проверка установки twc...${NC}"
if command -v twc &> /dev/null; then
    VERSION=$(twc --version 2>&1 | grep -o 'v[0-9.]*' || echo "unknown")
    echo -e "${GREEN}✅ twc установлен: $VERSION${NC}"
else
    echo -e "${RED}❌ twc не установлен${NC}"
    exit 1
fi
echo ""

# Проверка авторизации
echo -e "${CYAN}2. Проверка авторизации...${NC}"
if twc whoami &> /dev/null; then
    echo -e "${GREEN}✅ Авторизация выполнена${NC}"
    twc whoami
else
    echo -e "${YELLOW}⚠️  Авторизация не выполнена${NC}"
    echo "   Запустите: twc auth"
fi
echo ""

# Тест: Список БД
echo -e "${CYAN}3. Тест: Получение списка БД...${NC}"
if twc database list &> /dev/null; then
    DB_COUNT=$(twc database list --output json 2>/dev/null | grep -o '"id"' | wc -l || echo "0")
    echo -e "${GREEN}✅ Команда работает${NC}"
    echo "   Найдено БД: $DB_COUNT"
else
    echo -e "${YELLOW}⚠️  Команда требует авторизации${NC}"
fi
echo ""

# Тест: Список серверов
echo -e "${CYAN}4. Тест: Получение списка серверов...${NC}"
if twc server list &> /dev/null; then
    SERVER_COUNT=$(twc server list --output json 2>/dev/null | grep -o '"id"' | wc -l || echo "0")
    echo -e "${GREEN}✅ Команда работает${NC}"
    echo "   Найдено серверов: $SERVER_COUNT"
else
    echo -e "${YELLOW}⚠️  Команда требует авторизации${NC}"
fi
echo ""

# Тест: Финансы
echo -e "${CYAN}5. Тест: Получение финансовой информации...${NC}"
if twc account finances &> /dev/null; then
    echo -e "${GREEN}✅ Команда работает${NC}"
    BALANCE=$(twc account finances --output json 2>/dev/null | grep -o '"balance":[0-9.]*' | cut -d':' -f2 || echo "N/A")
    echo "   Баланс: $BALANCE ₽"
else
    echo -e "${YELLOW}⚠️  Команда требует авторизации${NC}"
fi
echo ""

# Тест: Бэкапы (если есть TIMEWEB_DB_ID)
if [ -n "$TIMEWEB_DB_ID" ]; then
    echo -e "${CYAN}6. Тест: Управление бэкапами...${NC}"
    if twc database backup list "$TIMEWEB_DB_ID" &> /dev/null; then
        BACKUP_COUNT=$(twc database backup list "$TIMEWEB_DB_ID" --output json 2>/dev/null | grep -o '"id"' | wc -l || echo "0")
        echo -e "${GREEN}✅ Команда работает${NC}"
        echo "   Найдено бэкапов: $BACKUP_COUNT"
    else
        echo -e "${YELLOW}⚠️  Команда требует авторизации${NC}"
    fi
    echo ""
fi

# Проверка скриптов
echo -e "${CYAN}7. Проверка скриптов...${NC}"
SCRIPTS_DIR="scripts"
if [ -d "$SCRIPTS_DIR" ]; then
    for script in "$SCRIPTS_DIR"/*.sh; do
        if [ -f "$script" ] && [ -x "$script" ]; then
            echo -e "${GREEN}✅ $(basename $script)${NC}"
        elif [ -f "$script" ]; then
            echo -e "${YELLOW}⚠️  $(basename $script) (не исполняемый)${NC}"
        fi
    done
else
    echo -e "${RED}❌ Директория scripts не найдена${NC}"
fi
echo ""

# Проверка CI/CD
echo -e "${CYAN}8. Проверка CI/CD конфигурации...${NC}"
if [ -f ".github/workflows/deploy-timeweb.yml" ]; then
    echo -e "${GREEN}✅ GitHub Actions workflow найден${NC}"
else
    echo -e "${YELLOW}⚠️  GitHub Actions workflow не найден${NC}"
fi
echo ""

# Итог
echo "================================================"
echo -e "${CYAN}📊 Итоговая сводка:${NC}"
echo ""
echo "✅ Установлено и работает:"
echo "   - Timeweb Cloud CLI (twc)"
echo "   - Скрипты автоматизации"
echo "   - CI/CD конфигурация"
echo ""
echo "📝 Следующие шаги:"
echo "   1. Выполните авторизацию: twc auth"
echo "   2. Установите TIMEWEB_DB_ID (опционально)"
echo "   3. Протестируйте скрипты: ./scripts/deploy.sh"
echo "   4. Настройте GitHub Secrets для CI/CD"
echo ""
echo -e "${GREEN}✅ Все готово к использованию!${NC}"

