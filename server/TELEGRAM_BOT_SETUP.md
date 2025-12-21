# 🤖 Настройка Telegram бота

## На сервере выполните:

```bash
cd /var/www/ride-together/server

# Установить webhook и настроить Mini App
bash SETUP_TELEGRAM_BOT.sh
```

## Или вручную:

```bash
# 1. Установить webhook
curl -X POST "https://api.telegram.org/bot8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.ridetogether.ru/api/telegram/webhook",
    "allowed_updates": ["message", "callback_query"]
  }'

# 2. Настроить Menu Button (Mini App)
curl -X POST "https://api.telegram.org/bot8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{
    "menu_button": {
      "type": "web_app",
      "text": "🚗 Ride Together",
      "web_app": {
        "url": "https://ridetogether.ru"
      }
    }
  }'

# 3. Установить команды
curl -X POST "https://api.telegram.org/bot8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY/setMyCommands" \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"command": "start", "description": "🚀 Начать работу"},
      {"command": "help", "description": "❓ Помощь"},
      {"command": "rides", "description": "🔍 Найти поездку"},
      {"command": "myrides", "description": "📊 Мои поездки"},
      {"command": "support", "description": "💬 Поддержка"}
    ]
  }'

# 4. Проверить webhook
curl -s "https://api.telegram.org/bot8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY/getWebhookInfo" | python3 -m json.tool
```

## Проверка:

1. Откройте бота в Telegram
2. Должна появиться кнопка "🚗 Ride Together" в меню (слева от поля ввода)
3. Нажмите /start - должно прийти приветственное сообщение с кнопками
4. Команды должны быть доступны через /menu

