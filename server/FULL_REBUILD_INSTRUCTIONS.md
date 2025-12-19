# Полная пересборка сервера - Инструкция

## ✅ Что исправлено:

1. ✅ Исправлен `tsconfig.json` - module изменен на "NodeNext"
2. ✅ Исправлен `utils/profile.ts` - добавлен .js к импорту database
3. ✅ Улучшен `fix-imports.js` - теперь автоматически исправляет __dirname
4. ✅ Создан скрипт `rebuild-server.sh` для полной пересборки

## 📋 Шаги для запуска на сервере:

### 1. Скопируйте исправленные файлы на сервер:

```bash
# На вашем локальном компьютере
cd /Users/ahmeddevops/Desktop/ride/ride-together/server

# Скопируйте эти файлы:
scp fix-imports.js root@194.67.124.123:/var/www/ride-together/server/
scp rebuild-server.sh root@194.67.124.123:/var/www/ride-together/server/
scp utils/profile.ts root@194.67.124.123:/var/www/ride-together/server/utils/
scp index.ts root@194.67.124.123:/var/www/ride-together/server/
scp tsconfig.json root@194.67.124.123:/var/www/ride-together/server/
```

### 2. Подключитесь к серверу:

```bash
ssh root@194.67.124.123
```

### 3. Запустите скрипт пересборки:

```bash
cd /var/www/ride-together/server
chmod +x rebuild-server.sh
./rebuild-server.sh
```

## 🔍 Альтернативный способ (если scp не работает):

### Вариант 1: Через веб-консоль REG.RU
1. Зайдите в панель REG.RU → VPS → Консоль
2. Вручную скопируйте содержимое файлов через редактор

### Вариант 2: Через tar архив
```bash
# На локальном компьютере создайте архив
cd /Users/ahmeddevops/Desktop/ride/ride-together/server
tar -czf server-fix.tar.gz fix-imports.js rebuild-server.sh utils/profile.ts index.ts tsconfig.json

# Скопируйте архив
scp server-fix.tar.gz root@194.67.124.123:/tmp/

# На сервере распакуйте
ssh root@194.67.124.123
cd /var/www/ride-together/server
tar -xzf /tmp/server-fix.tar.gz
chmod +x rebuild-server.sh
./rebuild-server.sh
```

## 🔧 Что делает скрипт rebuild-server.sh:

1. Очищает старые файлы (rm -rf dist)
2. Устанавливает зависимости (npm install)
3. Компилирует TypeScript (npx tsc)
4. Исправляет импорты и __dirname (node fix-imports.js)
5. Проверяет синтаксис (node --check)
6. Перезапускает PM2 (pm2 restart)
7. Показывает логи и статус

## ⚠️ Если возникают проблемы:

### Проверьте логи:
```bash
pm2 logs ride-backend --lines 50
```

### Проверьте статус:
```bash
pm2 status
```

### Ручная пересборка:
```bash
cd /var/www/ride-together/server
rm -rf dist
npm install
npx tsc
node fix-imports.js
pm2 restart ride-backend
```

## 📝 Все исправления:

- ✅ `tsconfig.json`: module: "NodeNext" (было "ESNext")
- ✅ `utils/profile.ts`: импорт с .js расширением
- ✅ `fix-imports.js`: автоматическое исправление __dirname
- ✅ Все API файлы: правильные типы Request/Response
- ✅ Все импорты: с .js расширениями

После выполнения скрипта сервер должен запуститься без ошибок! 🚀

