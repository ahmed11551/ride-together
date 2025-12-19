# Инструкция по исправлению проблем на сервере

## Проблема
Сервер выдает ошибки `ERR_MODULE_NOT_FOUND` из-за отсутствия расширений `.js` в импортах скомпилированных файлов.

## Решение

### Вариант 1: Быстрое исправление (без пересборки)

Подключитесь к серверу и выполните:

```bash
cd /var/www/ride-together/server

# Скопируйте скрипт исправления (если его еще нет)
# Или создайте его вручную из fix-imports-simple.js

# Запустите исправление
node fix-imports-simple.js dist

# Перезапустите PM2
pm2 restart ride-backend
```

### Вариант 2: Полная пересборка (рекомендуется)

```bash
cd /var/www/ride-together/server

# Обновите код (если используете git)
# git pull

# Или загрузите обновленные файлы через scp/sftp

# Установите зависимости
npm install

# Пересоберите проект (теперь автоматически исправляет импорты)
npm run build

# Перезапустите PM2
pm2 restart ride-backend

# Проверьте логи
pm2 logs ride-backend --lines 50
```

### Вариант 3: Ручное исправление одного файла

Если нужно быстро исправить только `dist/index.js`:

```bash
cd /var/www/ride-together/server/dist

# Исправляем импорты в index.js
sed -i "s/from '\\.\\/websocket\\/server'/from '.\/websocket\/server.js'/g" index.js
sed -i "s/from '\\.\\/api\\//from '.\/api\//g" index.js
sed -i "s/from '\\.\\.\\/utils\\//from '..\/utils\//g" index.js
sed -i "s/from '\\.\\.\\/utils\\//from '..\/utils\//g" api/**/*.js

# Перезапустите
pm2 restart ride-backend
```

## Проверка

После исправления проверьте:

```bash
# Проверьте логи
pm2 logs ride-backend --lines 30

# Проверьте health endpoint
curl http://localhost:3001/health

# Проверьте с внешнего IP
curl http://194.67.124.123:3001/health
```

## Что было исправлено

1. ✅ Обновлен `tsconfig.json` для правильной работы с ESM
2. ✅ Создан скрипт `fix-imports.js` для автоматического исправления импортов после сборки
3. ✅ Обновлен `package.json` - команда `build` теперь автоматически исправляет импорты
4. ✅ Создан простой скрипт `fix-imports-simple.js` для исправления уже скомпилированных файлов

