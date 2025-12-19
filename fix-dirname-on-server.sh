#!/bin/bash
# Скрипт для исправления __dirname на сервере

cat <<'EOFSCRIPT' | ssh root@194.67.124.123 'bash -s'
cd /var/www/ride-together/server/dist

# Создайте бэкап
cp index.js index.js.backup

# Проверьте текущее содержимое (первые 15 строк)
echo "=== Текущее содержимое (первые 15 строк) ==="
head -15 index.js

# Создайте временный файл с исправлением
cat > /tmp/fix_index.js <<'FIXSCRIPT'
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Получаем __dirname для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

FIXSCRIPT

# Сохраните остальную часть файла (после строки 8)
tail -n +9 index.js > /tmp/index_tail.js

# Объедините исправленный заголовок и хвост
cat /tmp/fix_index.js /tmp/index_tail.js > index.js

# Проверьте результат
echo ""
echo "=== После исправления (первые 15 строк) ==="
head -15 index.js | grep -A 10 "fileURLToPath\|__dirname"

echo ""
echo "✅ Файл исправлен! Теперь перезапустите PM2:"
echo "pm2 restart ride-backend"
EOFSCRIPT

