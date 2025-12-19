#!/bin/bash
# Скрипт для исправления оставшихся сигнатур функций

cd "$(dirname "$0")/server/api" || exit 1

# Список файлов для исправления с их функциями
declare -A FUNCTIONS=(
  ["messages/list.ts"]="listMessages"
  ["rides/update.ts"]="updateRide"
  ["rides/delete.ts"]="deleteRide"
  ["bookings/ride.ts"]="getRideBookings"
  ["bookings/update.ts"]="updateBooking"
  ["profiles/get.ts"]="getProfile"
  ["profiles/ban.ts"]="banUser"
  ["reports/update.ts"]="updateReport"
)

for file in "${!FUNCTIONS[@]}"; do
  func="${FUNCTIONS[$file]}"
  
  if [ -f "$file" ]; then
    echo "Исправляю $file..."
    
    # Исправляем сигнатуру: добавляем res: Response перед последним параметром
    # и меняем Promise<Response> на Promise<void>
    sed -i.bak \
      -e "s/export async function $func(req: Request,\([^)]*\)): Promise<Response>/export async function $func(req: Request, res: Response,\1): Promise<void>/" \
      -e "s/export async function $func(req: Request): Promise<Response>/export async function $func(req: Request, res: Response): Promise<void>/" \
      "$file"
    
    # Удаляем бэкап файлы
    rm -f "${file}.bak"
    
    echo "✅ Исправлен $file"
  else
    echo "⚠️  Файл не найден: $file"
  fi
done

echo ""
echo "✅ Готово! Теперь нужно обновить index.ts для этих функций."

