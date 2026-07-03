#!/usr/bin/env bash
# Применяет схему БД. Запускать на сервере или локально.
# Использование: DATABASE_URL=postgresql://... ./scripts/setup-database.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCHEMA="$ROOT/database/schema.sql"

if [ -z "${DATABASE_URL:-}" ]; then
  for envfile in "$ROOT/server/.env.production" "$ROOT/server/.env"; do
    if [ -f "$envfile" ]; then
      DATABASE_URL=$(grep -m1 '^DATABASE_URL=' "$envfile" | cut -d= -f2- | tr -d '"' | tr -d "'")
      export DATABASE_URL
      break
    fi
  done
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL не задан. Экспортируйте или создайте server/.env.production"
  exit 1
fi

if ! command -v psql &>/dev/null; then
  echo "❌ psql не найден. Установите: apt install postgresql-client"
  exit 1
fi

echo "📦 Применяю схему: $SCHEMA"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SCHEMA"
echo "✅ База данных готова"
