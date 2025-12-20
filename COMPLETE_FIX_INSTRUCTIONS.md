# Полное исправление всех проблем

## ✅ Что исправлено локально:
1. Файлы восстановлены из Git
2. Frontend собран (frontend.tar.gz готов)

## 📋 Инструкции для сервера:

### Шаг 1: Исправить ошибку API и перезапустить сервер

Выполните на сервере:

```bash
cd /var/www/ride-together/server

# Скопируйте скрипт исправления на сервер или выполните команды вручную:

# 1. Исправление req.headers.get
find dist/api -name "*.js" -type f -exec sed -i 's/req\.headers\.get(/req.get(/g' {} \;
find dist/api -name "*.js" -type f -exec sed -i 's/headers\.get(/req.get(/g' {} \;

# 2. Исправление Nginx proxy_pass (убрать завершающий слэш)
sed -i 's|proxy_pass http://127.0.0.1:3001/;|proxy_pass http://127.0.0.1:3001;|g' /etc/nginx/sites-available/ride-together-api
sed -i 's|proxy_pass http://localhost:3001/;|proxy_pass http://localhost:3001;|g' /etc/nginx/sites-available/ride-together-api
nginx -t && systemctl reload nginx

# 3. Перезапуск PM2
pm2 restart ride-backend --update-env

# 4. Проверка
sleep 3
curl -s http://localhost:3001/api/rides?limit=1 | head -c 200
```

### Шаг 2: Загрузить frontend на сервер

**На вашем Mac:**

```bash
cd /Users/ahmeddevops/Desktop/ride/ride-together
scp frontend.tar.gz root@194.67.124.123:/tmp/
```

**На сервере:**

```bash
cd /var/www/ride-together/frontend-dist
rm -rf *
tar -xzf /tmp/frontend.tar.gz
chown -R www-data:www-data .
chmod -R 755 .
```

### Шаг 3: Проверка

```bash
# Проверка API
curl -s https://ridetogether.ru/api/rides?limit=1 | head -c 200

# Проверка frontend
curl -I https://ridetogether.ru/ | head -3

# Проверка favicon
ls -la /var/www/ride-together/frontend-dist/favicon.ico
```

## 🎯 Итоговые исправления:

1. ✅ **req.headers.get** → **req.get()** (исправлено в dist файлах)
2. ✅ **proxy_pass с завершающим слэшем** → **без слэша** (исправлено в Nginx)
3. ✅ **Frontend файлы** → **восстановлены** (из dist на сервере или загружены)

## 🔍 Если что-то не работает:

```bash
# Проверка логов
pm2 logs ride-backend --err --lines 20 --nostream

# Проверка Nginx
tail -20 /var/log/nginx/ridetogether-error.log

# Проверка портов
ss -tlnp | grep 3001
```

