#!/bin/bash

# Скрипт проверки готовности к деплою
# Проверяет все необходимые настройки

set -e

echo "🔍 Проверка готовности к деплою"
echo "================================"
echo ""

ERRORS=0
WARNINGS=0

# Проверка переменных окружения в server/.env
if [ -f "server/.env" ]; then
  echo "📝 Проверка server/.env..."
  
  REQUIRED_VARS=(
    "TIMEWEB_DB_HOST"
    "TIMEWEB_DB_NAME"
    "TIMEWEB_DB_USER"
    "TIMEWEB_DB_PASSWORD"
    "JWT_SECRET"
  )
  
  for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${var}=" server/.env && ! grep -q "^${var}=$" server/.env && ! grep -q "^${var}=your-" server/.env; then
      echo "  ✅ $var установлен"
    else
      echo "  ❌ $var не установлен или имеет значение по умолчанию"
      ERRORS=$((ERRORS + 1))
    fi
  done
  
  # Проверка JWT_SECRET длины
  JWT_SECRET=$(grep "^JWT_SECRET=" server/.env | cut -d '=' -f2)
  if [ ${#JWT_SECRET} -lt 32 ]; then
    echo "  ⚠️  JWT_SECRET слишком короткий (минимум 32 символа)"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo "❌ server/.env не найден"
  echo "   Создайте его из server/env.example"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# Проверка ca.crt
if [ -f "ca.crt" ]; then
  echo "✅ ca.crt найден"
else
  echo "⚠️  ca.crt не найден"
  echo "   Убедитесь, что он будет доступен на сервере"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Проверка сборки
echo "🏗️  Проверка сборки..."

if [ -d "server/dist" ]; then
  echo "  ✅ Бэкенд собран (server/dist существует)"
else
  echo "  ⚠️  Бэкенд не собран (запустите: cd server && npm run build)"
  WARNINGS=$((WARNINGS + 1))
fi

if [ -d "dist" ]; then
  echo "  ✅ Фронтенд собран (dist существует)"
else
  echo "  ⚠️  Фронтенд не собран (запустите: npm run build)"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Проверка git статуса
echo "📦 Проверка git статуса..."
if git diff --quiet && git diff --cached --quiet; then
  echo "  ✅ Все изменения закоммичены"
else
  echo "  ⚠️  Есть незакоммиченные изменения"
  echo "     Рекомендуется закоммитить перед деплоем"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Итоги
echo "================================"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ Все проверки пройдены!"
  echo ""
  echo "Готово к деплою!"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo "⚠️  Есть предупреждения ($WARNINGS), но можно продолжать"
  exit 0
else
  echo "❌ Найдено ошибок: $ERRORS"
  echo "⚠️  Предупреждений: $WARNINGS"
  echo ""
  echo "Исправьте ошибки перед деплоем"
  exit 1
fi
