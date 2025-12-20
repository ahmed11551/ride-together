# Быстрое исправление - выполните эти команды

## Шаг 1: Загрузите файлы на сервер (на вашем Mac)

```bash
cd /Users/ahmeddevops/Desktop/ride/ride-together

# Загрузите frontend архив
scp frontend.tar.gz root@194.67.124.123:/tmp/

# Загрузите скрипт исправления
scp server/FIX_EVERYTHING.sh root@194.67.124.123:/tmp/
```

## Шаг 2: Выполните исправления на сервере (подключитесь к серверу)

```bash
# Подключитесь к серверу
ssh root@194.67.124.123

# Выполните скрипт
chmod +x /tmp/FIX_EVERYTHING.sh
/tmp/FIX_EVERYTHING.sh
```

## Альтернатива: выполните команды вручную на сервере

Если скрипт не работает, выполните эти команды по порядку:

```bash
cd /var/www/ride-together/server

# 1. Исправление req.headers.get
find dist/api -name "*.js" -exec sed -i 's/req\.headers\.get(/req.get(/g' {} \;
find dist/api -name "*.js" -exec sed -i 's/headers\.get(/req.get(/g' {} \;

# 2. Исправление Nginx
sed -i 's|proxy_pass http://127.0.0.1:3001/;|proxy_pass http://127.0.0.1:3001;|g' /etc/nginx/sites-available/ride-together-api
sed -i 's|proxy_pass http://localhost:3001/;|proxy_pass http://localhost:3001;|g' /etc/nginx/sites-available/ride-together-api
nginx -t && systemctl reload nginx

# 3. Восстановление frontend (если архив загружен)
cd /var/www/ride-together/frontend-dist
rm -rf *
tar -xzf /tmp/frontend.tar.gz
chown -R www-data:www-data .
chmod -R 755 .

# 4. Перезапуск PM2
cd /var/www/ride-together/server
pm2 restart ride-backend --update-env

# 5. Проверка
sleep 3
curl -s http://localhost:3001/api/rides?limit=1 | head -c 200
echo ""
curl -I https://ridetogether.ru/ | head -3
```

## После выполнения проверьте:

- ✅ API работает: https://ridetogether.ru/api/rides?limit=1
- ✅ Frontend загружается: https://ridetogether.ru/
- ✅ Нет ошибок в консоли браузера

