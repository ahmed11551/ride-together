#!/bin/bash

# Скрипт для экспорта данных из Supabase
# Использование: ./export-supabase-data.sh

set -e

echo "🔄 Экспорт данных из Supabase..."

# Переменные (замените на свои)
# Получите данные из Supabase Dashboard → Settings → Database → Connection string
# ВАЖНО: Если проект vcjnvkdqjrqymnmqdvfr не существует, найдите правильный проект в Supabase Dashboard

# Попытка получить из переменных окружения или использовать значения по умолчанию
SUPABASE_DB_HOST="${SUPABASE_DB_HOST:-db.vcjnvkdqjrqymnmqdvfr.supabase.co}"
SUPABASE_DB_PORT="${SUPABASE_DB_PORT:-5432}"
SUPABASE_DB_NAME="${SUPABASE_DB_NAME:-postgres}"
SUPABASE_DB_USER="${SUPABASE_DB_USER:-postgres}"
# Пароль получите из Supabase Dashboard → Settings → Database → Connection string → Reveal password
SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD:-your-password}"

# Или используйте переменную окружения
if [ -z "$SUPABASE_DB_PASSWORD" ] || [ "$SUPABASE_DB_PASSWORD" = "your-password" ]; then
  echo "⚠️  ВНИМАНИЕ: Укажите пароль!"
  echo ""
  echo "Способ 1: Через переменную окружения"
  echo "  export SUPABASE_DB_PASSWORD='your-password'"
  echo "  ./scripts/export-supabase-data.sh"
  echo ""
  echo "Способ 2: Отредактируйте скрипт и укажите пароль напрямую"
  echo ""
  echo "Способ 3: Используйте Supabase Dashboard → Database → Backups (проще!)"
  exit 1
fi

OUTPUT_FILE="supabase_backup_$(date +%Y%m%d_%H%M%S).sql"

echo "📦 Создание backup..."

# Экспорт схемы и данных
PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump \
  -h "$SUPABASE_DB_HOST" \
  -p "$SUPABASE_DB_PORT" \
  -U "$SUPABASE_DB_USER" \
  -d "$SUPABASE_DB_NAME" \
  --schema=public \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  > "$OUTPUT_FILE"

echo "✅ Backup создан: $OUTPUT_FILE"
echo "📊 Размер файла: $(du -h $OUTPUT_FILE | cut -f1)"

echo ""
echo "📋 Следующие шаги:"
echo "1. Проверьте backup файл"
echo "2. Импортируйте в Timeweb Cloud БД"
echo "3. Примените миграции"
