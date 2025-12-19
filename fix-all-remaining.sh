#!/bin/bash
# Скрипт для исправления всех оставшихся проблем

cd "$(dirname "$0")/server/api" || exit 1

# Исправляем отступы для res.status (добавляем 6 пробелов)
find . -name "*.ts" -exec sed -i.bak -E 's/^res\.status/      res.status/g' {} \;

# Исправляем сигнатуры функций
files=(
  "bookings/update.ts:updateBooking"
  "profiles/get.ts:getProfile"
  "profiles/ban.ts:banUser"
  "reports/update.ts:updateReport"
)

for entry in "${files[@]}"; do
  IFS=':' read -r file func <<< "$entry"
  if [ -f "$file" ]; then
    # Исправляем сигнатуру - добавляем res: Response после req
    sed -i.bak2 \
      -e "s/export async function $func(req: Request,\([^)]*\)): Promise<Response>/export async function $func(req: Request, res: Response,\1): Promise<void>/" \
      "$file"
    echo "✅ Исправлен $file"
  fi
done

# Удаляем бэкап файлы
find . -name "*.bak*" -delete

# Исправляем обрезанные JSON ответы вручную через специальную замену
echo "⚠️  Нужно вручную исправить обрезанные JSON ответы в следующих файлах:"
echo "  - api/bookings/update.ts (строка 89)"
echo "  - api/profiles/get.ts (строка 40)"
echo "  - api/profiles/ban.ts (строка 53)"
echo "  - api/reports/update.ts (строка 62)"

