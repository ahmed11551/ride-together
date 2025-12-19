#!/bin/bash
# Скрипт настройки Timeweb Cloud CLI

set -e

echo "🛠️  Настройка Timeweb Cloud CLI (twc)"

# Проверка установки
if ! command -v twc &> /dev/null; then
    echo "❌ twc не найден. Устанавливаю..."
    pip3 install twc-cli
    echo "✅ twc установлен"
else
    echo "✅ twc уже установлен"
    twc --version
fi

# Добавление PATH если нужно
PYTHON_BIN_PATH="/Users/ahmeddevops/Library/Python/3.9/bin"
if [[ ":$PATH:" != *":$PYTHON_BIN_PATH:"* ]]; then
    echo "📝 Добавляю $PYTHON_BIN_PATH в PATH"
    
    # Добавить в .zshrc если используем zsh
    if [ -n "$ZSH_VERSION" ] || [ "$SHELL" = "/bin/zsh" ]; then
        if ! grep -q "$PYTHON_BIN_PATH" ~/.zshrc 2>/dev/null; then
            echo 'export PATH="/Users/ahmeddevops/Library/Python/3.9/bin:$PATH"' >> ~/.zshrc
            echo "✅ PATH добавлен в ~/.zshrc"
            echo "⚠️  Выполните: source ~/.zshrc или откройте новый терминал"
        else
            echo "✅ PATH уже в ~/.zshrc"
        fi
    fi
    
    # Добавить в текущую сессию
    export PATH="$PYTHON_BIN_PATH:$PATH"
fi

# Проверка авторизации
echo ""
echo "🔐 Проверка авторизации..."
if twc config get token &> /dev/null; then
    echo "✅ twc уже настроен"
    echo "💡 Токен можно получить в: https://timeweb.cloud/api"
else
    echo "⚠️  twc не настроен. Запустите:"
    echo "   twc auth"
    echo ""
    echo "💡 Токен можно получить в панели управления:"
    echo "   https://timeweb.cloud/api"
fi

echo ""
echo "📚 Полезные команды:"
echo "   twc --help              # Справка"
echo "   twc database list       # Список БД"
echo "   twc server list         # Список серверов"
echo "   twc account finances    # Финансы"
echo ""
echo "✅ Готово!"

