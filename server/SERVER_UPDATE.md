# Инструкция по обновлению файлов на сервере

## Проблема
На сервере используются старые версии файлов, которые вызывают ошибки компиляции TypeScript.

## Решение

### Вариант 1: Обновить через scp (рекомендуется)

С вашего Mac выполните:

```bash
cd /Users/ahmeddevops/Desktop/ride/ride-together/server

# Загрузите обновленные файлы на сервер
scp -r api/ root@194.67.124.123:/var/www/ride-together/server/
scp index.ts root@194.67.124.123:/var/www/ride-together/server/
scp tsconfig.json root@194.67.124.123:/var/www/ride-together/server/
scp package.json root@194.67.124.123:/var/www/ride-together/server/
scp fix-imports.js root@194.67.124.123:/var/www/ride-together/server/
scp fix-imports-simple.js root@194.67.124.123:/var/www/ride-together/server/
```

### Вариант 2: Обновить через git (если используете git)

```bash
ssh root@194.67.124.123
cd /var/www/ride-together
git pull origin main  # или другая ветка
cd server
```

### Вариант 3: Скопировать весь проект

```bash
cd /Users/ahmeddevops/Desktop/ride
tar -czf ride-together-server.tar.gz ride-together/server/
scp ride-together-server.tar.gz root@194.67.124.123:/tmp/
ssh root@194.67.124.123
cd /var/www/ride-together
tar -xzf /tmp/ride-together-server.tar.gz --strip-components=1
cd server
```

## После обновления файлов

Подключитесь к серверу и выполните:

```bash
ssh root@194.67.124.123
cd /var/www/ride-together/server

# Установите зависимости (если нужно)
npm install

# Пересоберите проект
npm run build

# Перезапустите PM2
pm2 restart ride-backend

# Проверьте логи
pm2 logs ride-backend --lines 50
```

## Проверка

После обновления проверьте:

```bash
# Проверьте health endpoint
curl http://localhost:3001/health

# Или с внешнего IP
curl http://194.67.124.123:3001/health
```

## Важно

Убедитесь, что на сервере используются обновленные файлы:
- ✅ `req.body` вместо `req.json()` 
- ✅ Правильная типизация `req.body as {...}`
- ✅ `PORT` как число: `parseInt(process.env.PORT || '3001', 10)`

