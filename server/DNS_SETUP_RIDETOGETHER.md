# Настройка DNS для ridetogether.ru

## ⚠️ ВАЖНО: Обновите DNS записи в REG.RU!

Сейчас в DNS указан неправильный IP адрес. Нужно изменить:

### Текущие записи (НЕПРАВИЛЬНЫЕ):
- `A @ → 95.163.244.138` ❌
- `A www → 95.163.244.138` ❌

### Правильные записи:
- `A @ → 194.67.124.123` ✅
- `A www → 194.67.124.123` ✅
- `A api → 194.67.124.123` ✅ (ДОБАВЬТЕ эту запись!)

## Шаги:

1. Зайдите в панель REG.RU → Домены → ridetogether.ru
2. Перейдите в раздел "Ресурсные записи"
3. Измените существующие A записи:
   - `A @ → 194.67.124.123` (измените 95.163.244.138 на 194.67.124.123)
   - `A www → 194.67.124.123` (измените 95.163.244.138 на 194.67.124.123)
4. Добавьте новую запись:
   - Нажмите "Добавить запись"
   - Тип: `A`
   - Имя: `api`
   - Значение: `194.67.124.123`
   - TTL: оставьте по умолчанию
   - Сохраните

## После обновления DNS:

Подождите 5-15 минут для распространения DNS записей, затем:

```bash
# Проверка DNS
nslookup api.ridetogether.ru
nslookup ridetogether.ru

# Должны показать IP: 194.67.124.123
```

## Установка nginx на сервере:

После обновления DNS, на сервере выполните:

```bash
# 1. Установка nginx и certbot
apt update
apt install -y nginx certbot python3-certbot-nginx

# 2. Создайте конфигурацию
nano /etc/nginx/sites-available/ride-together-api
```

Вставьте содержимое из файла `nginx-ridetogether.conf`

```bash
# 3. Активируйте конфигурацию
ln -s /etc/nginx/sites-available/ride-together-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 4. Проверьте конфигурацию
nginx -t

# 5. Перезагрузите nginx
systemctl reload nginx

# 6. Получите SSL сертификат
certbot --nginx -d api.ridetogether.ru -d ridetogether.ru -d www.ridetogether.ru

# 7. Обновите переменные окружения PM2
cd /var/www/ride-together/server
nano ecosystem.config.cjs
```

Обновите ALLOWED_ORIGINS:
```javascript
ALLOWED_ORIGINS: 'https://ridetogether.ru,https://www.ridetogether.ru,https://api.ridetogether.ru'
```

```bash
# 8. Перезапустите PM2
pm2 restart ride-backend --update-env

# 9. Проверка
curl https://api.ridetogether.ru/health
```

