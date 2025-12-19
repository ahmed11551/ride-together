#!/bin/bash
# Обновление Telegram бота на сервере - выполнить прямо на сервере

cd /var/www/ride-together/server

echo "🤖 Настройка Telegram бота..."

# 1. Обновляем ecosystem.config.cjs
echo "📝 Обновление ecosystem.config.cjs..."
cat > /tmp/update_ecosystem.js << 'EOF'
const fs = require('fs');
const config = require('./ecosystem.config.cjs');

if (!config.apps[0].env.TELEGRAM_BOT_TOKEN) {
  config.apps[0].env.TELEGRAM_BOT_TOKEN = '8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY';
  config.apps[0].env.FRONTEND_URL = 'https://ridetogether.ru';
  fs.writeFileSync('./ecosystem.config.cjs', `module.exports = ${JSON.stringify(config, null, 2).replace(/"([^"]+)":/g, '$1:').replace(/"/g, "'")};`);
  console.log("✅ ecosystem.config.cjs обновлен");
} else {
  console.log("✅ TELEGRAM_BOT_TOKEN уже установлен");
}
EOF

node /tmp/update_ecosystem.js || {
  echo "⚠️  Обновите ecosystem.config.cjs вручную:"
  echo "   Добавьте в env:"
  echo "   TELEGRAM_BOT_TOKEN: '8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY',"
}

# 2. Обновляем .env.production
if [ -f .env.production ]; then
  if grep -q "TELEGRAM_BOT_TOKEN" .env.production; then
    sed -i "s|TELEGRAM_BOT_TOKEN=.*|TELEGRAM_BOT_TOKEN=8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY|" .env.production
  else
    echo "" >> .env.production
    echo "TELEGRAM_BOT_TOKEN=8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY" >> .env.production
    echo "FRONTEND_URL=https://ridetogether.ru" >> .env.production
  fi
  echo "✅ .env.production обновлен"
else
  echo "TELEGRAM_BOT_TOKEN=8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY" > .env.production
  echo "FRONTEND_URL=https://ridetogether.ru" >> .env.production
  echo "✅ .env.production создан"
fi

# 3. Проверяем информацию о боте
echo "🔍 Проверка бота..."
BOT_INFO=$(curl -s "https://api.telegram.org/bot8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY/getMe")
BOT_USERNAME=$(echo $BOT_INFO | grep -o '"username":"[^"]*' | cut -d'"' -f4)

if [ -z "$BOT_USERNAME" ]; then
  echo "❌ Ошибка получения информации о боте"
  echo "$BOT_INFO"
else
  echo "✅ Бот найден: @${BOT_USERNAME}"
fi

# 4. Перезапуск PM2
echo "🔄 Перезапуск PM2..."
pm2 restart ride-backend --update-env

sleep 3

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "🧪 Проверка:"
echo "   1. Найдите бота: @${BOT_USERNAME:-RideTogetherBot}"
echo "   2. Отправьте /start"
echo ""
echo "🔗 После настройки HTTPS установите webhook:"
echo "   curl -X POST \"https://api.telegram.org/bot8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY/setWebhook\" \\"
echo "     -d \"url=https://api.ridetogether.ru/api/telegram/webhook\""

