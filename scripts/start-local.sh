#!/usr/bin/env bash
# Локальный запуск: PostgreSQL (Docker) + backend + frontend
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="${NVM_DIR:+$NVM_DIR/versions/node/$(ls "$NVM_DIR/versions/node" 2>/dev/null | tail -1)/bin:}$PATH"
[ -f "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh" 2>/dev/null || true

DOCKER=""
for c in docker "/Applications/Docker.app/Contents/Resources/bin/docker"; do
  if command -v "$c" &>/dev/null || [ -x "$c" ]; then DOCKER="$c"; break; fi
done

echo "🚀 Ride Together — локальный запуск"

# PostgreSQL через Docker
if [ -n "$DOCKER" ]; then
  echo "📦 Запуск PostgreSQL..."
  $DOCKER compose up -d db
  echo "⏳ Ожидание БД..."
  for i in $(seq 1 30); do
    $DOCKER compose exec -T db pg_isready -U ride -d ride_together &>/dev/null && break
    sleep 1
  done
  if [ ! -f server/.env ]; then
    cp server/env.example server/.env 2>/dev/null || true
  fi
  if ! grep -q '^DATABASE_URL=' server/.env 2>/dev/null; then
    echo 'DATABASE_URL=postgresql://ride:ride@localhost:5432/ride_together' >> server/.env
  fi
  echo "📦 Применение схемы..."
  DATABASE_URL=postgresql://ride:ride@localhost:5432/ride_together bash scripts/setup-database.sh 2>/dev/null || true
else
  echo "⚠️  Docker не найден — нужен PostgreSQL на localhost:5432"
  echo "   Установите Docker Desktop или PostgreSQL вручную"
fi

# Backend
echo "📦 Backend..."
cd server
npm install
npm run build
npm run dev &
BACKEND_PID=$!
cd ..

# Frontend
echo "📦 Frontend..."
npm install
npm run dev &
FRONTEND_PID=$!

echo ""
echo "============================================"
echo "  Frontend: http://localhost:8080"
echo "  Backend:  http://localhost:3001/health"
echo "  Остановка: kill $BACKEND_PID $FRONTEND_PID"
echo "============================================"

wait
