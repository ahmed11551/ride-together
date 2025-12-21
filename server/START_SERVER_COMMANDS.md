# Команды для создания и запуска скрипта на сервере

## Вариант 1: Создать скрипт через cat

Выполните на сервере:

```bash
cd /var/www/ride-together/server

cat > START_SERVER.sh << 'EOF'
#!/bin/bash
cd /var/www/ride-together/server

echo "📦 Установка зависимостей..."
npm install

echo ""
echo "🔨 Компиляция TypeScript..."
npm run build

echo ""
echo "🔧 Исправление проблем после компиляции..."

# Исправить __dirname
if [ -f "dist/index.js" ]; then
  sed -i 's/path\.join(__dirname/path.join(process.cwd()/g' dist/index.js
  sed -i '/const __filename = fileURLToPath(import\.meta\.url);/d' dist/index.js
  sed -i '/const __dirname = dirname(__filename);/d' dist/index.js
  sed -i '/let __filename = fileURLToPath(import\.meta\.url);/d' dist/index.js
  sed -i '/let __dirname = dirname(__filename);/d' dist/index.js
  echo "✅ __dirname исправлен"
fi

# Исправить req.headers.get
find dist -name "*.js" -type f -exec sed -i 's/req\.headers\.get(/req.get(/g' {} \; 2>/dev/null
find dist -name "*.js" -type f -exec sed -i 's/headers\.get(/req.get(/g' {} \; 2>/dev/null
echo "✅ req.headers.get исправлен"

echo ""
echo "🔄 Запуск через PM2..."
pm2 restart ride-backend || pm2 start ecosystem.config.cjs

echo ""
echo "⏳ Ожидание 3 секунды..."
sleep 3

echo ""
echo "📋 Статус PM2:"
pm2 status

echo ""
echo "📋 Последние логи:"
pm2 logs ride-backend --lines 20 --nostream

echo ""
echo "✅ Готово!"
EOF

chmod +x START_SERVER.sh
./START_SERVER.sh
```

## Вариант 2: Выполнить команды напрямую

```bash
cd /var/www/ride-together/server
npm install
npm run build

# Исправить __dirname
sed -i 's/path\.join(__dirname/path.join(process.cwd()/g' dist/index.js
sed -i '/const __filename = fileURLToPath(import\.meta\.url);/d' dist/index.js
sed -i '/const __dirname = dirname(__filename);/d' dist/index.js

# Исправить req.headers.get
find dist -name "*.js" -type f -exec sed -i 's/req\.headers\.get(/req.get(/g' {} \;

# Запустить
pm2 restart ride-backend
pm2 logs ride-backend --lines 20
```

