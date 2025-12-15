# 🚀 Деплой на Timeweb Cloud

## 📊 О Timeweb Cloud

**Timeweb Cloud** - российский облачный хостинг с хорошей производительностью для российских пользователей.

### ✅ Преимущества:
- ✅ Российский сервер (быстрее для пользователей из РФ)
- ✅ Низкая стоимость (~300-500₽/мес)
- ✅ Поддержка на русском языке
- ✅ Простая панель управления
- ✅ Хорошая производительность
- ✅ SSL сертификаты
- ✅ Резервное копирование

### ⚠️ Особенности:
- ⚠️ Нет автоматического деплоя из Git (нужно настраивать вручную или через CI/CD)
- ⚠️ Нужно настраивать сервер самому
- ⚠️ Меньше автоматизации чем Vercel/Netlify

---

## 🎯 Варианты деплоя на Timeweb Cloud

### Вариант 1: Статический хостинг (Рекомендуется)

**Подходит для:** React SPA приложения

**Шаги:**
1. Соберите проект локально: `npm run build`
2. Загрузите папку `dist/` на сервер через FTP/SFTP
3. Настройте веб-сервер (Nginx/Apache) для SPA

### Вариант 2: VPS с автоматическим деплоем

**Подходит для:** Если нужен автоматический деплой

**Шаги:**
1. Создайте VPS в Timeweb Cloud
2. Настройте Node.js окружение
3. Настройте CI/CD через GitHub Actions
4. Автоматический деплой при push

### Вариант 3: Docker контейнер

**Подходит для:** Если используете Docker

**Шаги:**
1. Создайте Dockerfile
2. Соберите образ
3. Запустите контейнер на Timeweb Cloud

---

## 📋 Пошаговая инструкция: Статический хостинг

### Шаг 1: Сборка проекта

```bash
cd /Users/ahmeddevops/Desktop/ride/ride-together
npm run build
```

Файлы будут в папке `dist/`

### Шаг 2: Подключение к серверу

**Через FTP/SFTP:**
1. В панели Timeweb Cloud найдите данные для FTP
2. Используйте FileZilla или другой FTP клиент
3. Подключитесь к серверу
4. Загрузите содержимое папки `dist/` в корневую директорию сайта

**Через SSH (если есть доступ):**
```bash
# Создайте архив
cd dist
tar -czf ../ride-together.tar.gz .

# Загрузите на сервер (замените данные)
scp ride-together.tar.gz user@your-server.com:/var/www/html/

# На сервере распакуйте
ssh user@your-server.com
cd /var/www/html/
tar -xzf ride-together.tar.gz
```

### Шаг 3: Настройка веб-сервера

**Для Nginx** (создайте файл конфигурации):

```nginx
server {
    listen 80;
    server_name your-domain.ru;
    
    root /var/www/html;
    index index.html;
    
    # SPA routing - все запросы на index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Кэширование статики
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip сжатие
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # SSL (после настройки)
    # listen 443 ssl;
    # ssl_certificate /path/to/cert.pem;
    # ssl_certificate_key /path/to/key.pem;
}
```

**Для Apache** (создайте `.htaccess` в корне):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Кэширование
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
</IfModule>

# Gzip
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

### Шаг 4: Настройка переменных окружения

**Важно:** В production сборке переменные окружения встраиваются в код при сборке!

Перед сборкой создайте `.env.production`:

```env
VITE_SUPABASE_URL=https://vcjnvkdqjrqymnmqdvfr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_YANDEX_MAPS_API_KEY=your-yandex-key
VITE_TELEGRAM_BOT_TOKEN=your-telegram-token
VITE_VAPID_PUBLIC_KEY=your-vapid-key
```

Затем соберите:
```bash
npm run build
```

### Шаг 5: Настройка SSL

В панели Timeweb Cloud:
1. Перейдите в настройки домена
2. Включите SSL сертификат (Let's Encrypt бесплатно)
3. Настройте редирект HTTP → HTTPS

---

## 🔧 Вариант 2: Автоматический деплой через GitHub Actions

Создайте `.github/workflows/deploy-timeweb.yml`:

```yaml
name: Deploy to Timeweb

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
          VITE_YANDEX_MAPS_API_KEY: ${{ secrets.VITE_YANDEX_MAPS_API_KEY }}
          VITE_TELEGRAM_BOT_TOKEN: ${{ secrets.VITE_TELEGRAM_BOT_TOKEN }}
          VITE_VAPID_PUBLIC_KEY: ${{ secrets.VITE_VAPID_PUBLIC_KEY }}
      
      - name: Deploy to Timeweb via FTP
        uses: SamKirkland/FTP-Deploy-Action@4.3.0
        with:
          server: ${{ secrets.TIMEWEB_FTP_HOST }}
          username: ${{ secrets.TIMEWEB_FTP_USER }}
          password: ${{ secrets.TIMEWEB_FTP_PASSWORD }}
          local-dir: ./dist/
          server-dir: /public_html/
```

**Настройка секретов в GitHub:**
1. Repository → Settings → Secrets and variables → Actions
2. Добавьте:
   - `TIMEWEB_FTP_HOST`
   - `TIMEWEB_FTP_USER`
   - `TIMEWEB_FTP_PASSWORD`
   - Все `VITE_*` переменные

---

## 📊 Сравнение с другими хостингами

| Критерий | Timeweb Cloud | Vercel | Netlify |
|----------|---------------|--------|---------|
| **Стоимость** | ~300-500₽/мес | Бесплатно | Бесплатно |
| **Скорость для РФ** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Автодеплой** | ⚠️ Через CI/CD | ✅ Автоматически | ✅ Автоматически |
| **Простота** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Поддержка RU** | ✅ Да | ❌ Нет | ❌ Нет |
| **SSL** | ✅ Да | ✅ Автоматически | ✅ Автоматически |

---

## ✅ Преимущества Timeweb Cloud для вашего проекта

1. ✅ **Быстрее для российских пользователей** - серверы в РФ
2. ✅ **Поддержка на русском** - легче решать проблемы
3. ✅ **Низкая стоимость** - дешевле чем Vercel Pro
4. ✅ **Полный контроль** - можете настроить всё как нужно

---

## 🎯 Рекомендация

**Используйте Timeweb Cloud если:**
- ✅ Основная аудитория в России
- ✅ Нужна поддержка на русском
- ✅ Готовы настроить деплой вручную или через CI/CD
- ✅ Нужен полный контроль над сервером

**Используйте Vercel/Netlify если:**
- ✅ Нужен автоматический деплой из Git
- ✅ Хотите максимальную простоту
- ✅ Аудитория международная

---

## 🚀 Быстрый старт

1. **Соберите проект:**
   ```bash
   npm run build
   ```

2. **Загрузите на Timeweb Cloud:**
   - Через панель управления → Файловый менеджер
   - Или через FTP/SFTP

3. **Настройте веб-сервер:**
   - Добавьте конфигурацию Nginx/Apache для SPA

4. **Настройте SSL:**
   - В панели Timeweb включите Let's Encrypt

---

**Готов помочь с настройкой деплоя на Timeweb Cloud!** 🚀

Нужна помощь с конкретными шагами?
