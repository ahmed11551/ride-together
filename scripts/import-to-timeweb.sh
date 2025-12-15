#!/bin/bash

# Скрипт для импорта данных в Timeweb Cloud
# Использование: ./import-to-timeweb.sh backup.sql

set -e

if [ -z "$1" ]; then
  echo "❌ Ошибка: Укажите файл backup"
  echo "Использование: ./import-to-timeweb.sh backup.sql"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Ошибка: Файл $BACKUP_FILE не найден"
  exit 1
fi

# Проверка наличия сертификата
CERT_FILE="$(dirname "$0")/../ca.crt"
if [ ! -f "$CERT_FILE" ]; then
  echo "❌ Ошибка: Сертификат ca.crt не найден в корне проекта"
  exit 1
fi

echo "🔄 Импорт данных в Timeweb Cloud..."

# Переменные из окружения или значения по умолчанию
TIMEWEB_DB_HOST="${TIMEWEB_DB_HOST:-9d497bc2bf9dd679bd9834af.twc1.net}"
TIMEWEB_DB_PORT="${TIMEWEB_DB_PORT:-5432}"
TIMEWEB_DB_NAME="${TIMEWEB_DB_NAME:-default_db}"
TIMEWEB_DB_USER="${TIMEWEB_DB_USER:-gen_user}"
TIMEWEB_DB_PASSWORD="${TIMEWEB_DB_PASSWORD}"

if [ -z "$TIMEWEB_DB_PASSWORD" ]; then
  echo "❌ Ошибка: Укажите пароль через переменную окружения"
  echo "export TIMEWEB_DB_PASSWORD='your-password'"
  echo "./import-to-timeweb.sh backup.sql"
  exit 1
fi

echo "📦 Импорт из $BACKUP_FILE..."
echo "🔗 Подключение к $TIMEWEB_DB_HOST:$TIMEWEB_DB_PORT/$TIMEWEB_DB_NAME"

# Импорт данных с SSL
PGPASSWORD="$TIMEWEB_DB_PASSWORD" psql \
  -h "$TIMEWEB_DB_HOST" \
  -p "$TIMEWEB_DB_PORT" \
  -U "$TIMEWEB_DB_USER" \
  -d "$TIMEWEB_DB_NAME" \
  --set=sslmode=verify-full \
  --set=sslrootcert="$CERT_FILE" \
  < "$BACKUP_FILE"

echo "✅ Импорт завершен!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Примените миграции из supabase/migrations/"
echo "2. Проверьте целостность данных"
echo "3. Настройте Auth систему"
echo "4. Настройте Realtime"
