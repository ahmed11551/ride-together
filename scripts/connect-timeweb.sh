#!/bin/bash

# Скрипт для подключения к Timeweb Cloud Database
# Использование: ./connect-timeweb.sh

set -e

# Проверка наличия сертификата
CERT_FILE="$(dirname "$0")/../ca.crt"
if [ ! -f "$CERT_FILE" ]; then
  echo "❌ Ошибка: Сертификат ca.crt не найден в корне проекта"
  exit 1
fi

# Переменные из окружения или значения по умолчанию
TIMEWEB_DB_HOST="${TIMEWEB_DB_HOST:-9d497bc2bf9dd679bd9834af.twc1.net}"
TIMEWEB_DB_PORT="${TIMEWEB_DB_PORT:-5432}"
TIMEWEB_DB_NAME="${TIMEWEB_DB_NAME:-default_db}"
TIMEWEB_DB_USER="${TIMEWEB_DB_USER:-gen_user}"
TIMEWEB_DB_PASSWORD="${TIMEWEB_DB_PASSWORD}"

if [ -z "$TIMEWEB_DB_PASSWORD" ]; then
  echo "❌ Ошибка: Укажите пароль через переменную окружения"
  echo "export TIMEWEB_DB_PASSWORD='your-password'"
  echo "./connect-timeweb.sh"
  exit 1
fi

echo "🔗 Подключение к Timeweb Cloud Database..."
echo "Host: $TIMEWEB_DB_HOST"
echo "Database: $TIMEWEB_DB_NAME"
echo "User: $TIMEWEB_DB_USER"
echo ""

# Подключение с SSL
PGPASSWORD="$TIMEWEB_DB_PASSWORD" psql \
  -h "$TIMEWEB_DB_HOST" \
  -p "$TIMEWEB_DB_PORT" \
  -U "$TIMEWEB_DB_USER" \
  -d "$TIMEWEB_DB_NAME" \
  --set=sslmode=verify-full \
  --set=sslrootcert="$CERT_FILE"
