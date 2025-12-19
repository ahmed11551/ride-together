#!/bin/bash
# Клиент для работы с REG.RU CloudVPS API
# Документация: https://developers.cloudvps.reg.ru/

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Загрузка токена
TOKEN_FILE=".env.regru.token"
if [ -f "$TOKEN_FILE" ]; then
    source "$TOKEN_FILE"
    REG_RU_TOKEN=${REG_RU_API_TOKEN}
elif [ -n "$REG_RU_API_TOKEN" ]; then
    REG_RU_TOKEN=$REG_RU_API_TOKEN
else
    echo -e "${RED}❌ Токен не найден${NC}"
    echo "Создайте файл $TOKEN_FILE с содержимым:"
    echo "REG_RU_API_TOKEN=your-token"
    exit 1
fi

# API базовый URL
API_BASE="https://api.cloudvps.reg.ru/v1"

# Функция для API запросов
api_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    local url="${API_BASE}${endpoint}"
    local headers=(
        -H "Authorization: Bearer ${REG_RU_TOKEN}"
        -H "Content-Type: application/json"
    )
    
    if [ "$method" = "GET" ]; then
        curl -s -X GET "${headers[@]}" "$url"
    elif [ "$method" = "POST" ]; then
        curl -s -X POST "${headers[@]}" -d "$data" "$url"
    elif [ "$method" = "PUT" ]; then
        curl -s -X PUT "${headers[@]}" -d "$data" "$url"
    elif [ "$method" = "DELETE" ]; then
        curl -s -X DELETE "${headers[@]}" "$url"
    fi
}

# Проверка авторизации
check_auth() {
    echo -e "${CYAN}🔐 Проверка авторизации...${NC}"
    response=$(api_request "GET" "/account")
    
    if echo "$response" | grep -q "error\|unauthorized"; then
        echo -e "${RED}❌ Ошибка авторизации${NC}"
        echo "$response"
        return 1
    else
        echo -e "${GREEN}✅ Авторизация успешна${NC}"
        return 0
    fi
}

# Получить список тарифов
get_tariffs() {
    echo -e "${CYAN}📋 Получение списка тарифов...${NC}"
    api_request "GET" "/tariffs" | jq '.' || api_request "GET" "/tariffs"
}

# Получить список образов
get_images() {
    echo -e "${CYAN}🖼️  Получение списка образов...${NC}"
    api_request "GET" "/images" | jq '.' || api_request "GET" "/images"
}

# Получить список серверов
get_servers() {
    echo -e "${CYAN}🖥️  Получение списка серверов...${NC}"
    api_request "GET" "/servers" | jq '.' || api_request "GET" "/servers"
}

# Получить информацию о сервере
get_server() {
    local server_id=$1
    if [ -z "$server_id" ]; then
        echo -e "${RED}❌ Укажите ID сервера${NC}"
        return 1
    fi
    echo -e "${CYAN}📊 Информация о сервере $server_id...${NC}"
    api_request "GET" "/servers/$server_id" | jq '.' || api_request "GET" "/servers/$server_id"
}

# Создать сервер
create_server() {
    local name=$1
    local tariff_id=$2
    local image_id=$3
    
    if [ -z "$name" ] || [ -z "$tariff_id" ] || [ -z "$image_id" ]; then
        echo -e "${RED}❌ Использование: create_server <name> <tariff_id> <image_id>${NC}"
        echo ""
        echo "Пример:"
        echo "  $0 create-server 'ride-backend' 123 456"
        echo ""
        echo "Сначала получите список тарифов и образов:"
        echo "  $0 tariffs"
        echo "  $0 images"
        return 1
    fi
    
    echo -e "${CYAN}🚀 Создание сервера...${NC}"
    
    local data=$(cat <<EOF
{
  "name": "$name",
  "tariff_id": $tariff_id,
  "image_id": $image_id
}
EOF
)
    
    api_request "POST" "/servers" "$data" | jq '.' || api_request "POST" "/servers" "$data"
}

# Управление сервером
server_action() {
    local server_id=$1
    local action=$2
    
    if [ -z "$server_id" ] || [ -z "$action" ]; then
        echo -e "${RED}❌ Использование: server_action <server_id> <start|stop|restart|reboot>${NC}"
        return 1
    fi
    
    echo -e "${CYAN}⚙️  Выполнение действия '$action' на сервере $server_id...${NC}"
    
    local data="{\"action\": \"$action\"}"
    api_request "POST" "/servers/$server_id/action" "$data" | jq '.' || api_request "POST" "/servers/$server_id/action" "$data"
}

# Меню
show_help() {
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  REG.RU CloudVPS API Client            ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo "Использование: $0 <команда> [параметры]"
    echo ""
    echo "Команды:"
    echo "  check           - Проверить авторизацию"
    echo "  tariffs         - Список тарифов"
    echo "  images          - Список образов (ОС)"
    echo "  servers         - Список серверов"
    echo "  server <id>     - Информация о сервере"
    echo "  create-server <name> <tariff_id> <image_id>  - Создать сервер"
    echo "  start <id>      - Запустить сервер"
    echo "  stop <id>       - Остановить сервер"
    echo "  restart <id>    - Перезапустить сервер"
    echo ""
    echo "Примеры:"
    echo "  $0 check"
    echo "  $0 tariffs"
    echo "  $0 images"
    echo "  $0 servers"
    echo "  $0 create-server 'ride-backend' 123 456"
    echo ""
}

# Главный блок
case "$1" in
    check)
        check_auth
        ;;
    tariffs)
        get_tariffs
        ;;
    images)
        get_images
        ;;
    servers)
        get_servers
        ;;
    server)
        get_server "$2"
        ;;
    create-server)
        create_server "$2" "$3" "$4"
        ;;
    start)
        server_action "$2" "start"
        ;;
    stop)
        server_action "$2" "stop"
        ;;
    restart)
        server_action "$2" "restart"
        ;;
    *)
        show_help
        ;;
esac

