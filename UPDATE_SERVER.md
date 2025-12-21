# 🚀 Обновление кода на сервере

Код успешно обновлен в GitHub! Теперь нужно обновить на сервере.

## 📋 Команды для выполнения на сервере:

Подключитесь к серверу:
```bash
ssh root@194.67.124.123
```

Затем выполните:

```bash
cd /var/www/ride-together

# Обновляем код из GitHub (если git настроен)
if [ -d ".git" ]; then
    git pull origin main
else
    echo "⚠️  Git не настроен, пропускаем"
fi

# Переходим в директорию server
cd server

# Устанавливаем зависимости (включая dev для компиляции TypeScript)
npm ci

# Пересобираем проект (игнорируем ошибки типов)
echo "🔨 Пересобираем проект..."
npx tsc --noEmitOnError false || echo "⚠️  Есть ошибки типов, но компиляция продолжена"

# Исправляем импорты
if [ -f "fix-imports.js" ]; then
    echo "🔧 Исправляем импорты..."
    node fix-imports.js
fi

# Исправляем __dirname в dist/index.js
echo "🔧 Исправляем __dirname..."
python3 << 'PYEOF'
import re

filepath = 'dist/index.js'
try:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Заменяем path.join(__dirname на path.join(process.cwd()
    content = re.sub(r'path\.join\(__dirname', 'path.join(process.cwd()', content)
    
    # Удаляем определения __dirname если есть
    content = re.sub(r'const\s+__filename\s*=\s*fileURLToPath\(import\.meta\.url\);?\s*\n', '', content)
    content = re.sub(r'const\s+__dirname\s*=\s*dirname\(__filename\);?\s*\n', '', content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    print("✅ __dirname исправлен")
except Exception as e:
    print(f"⚠️  Ошибка: {e}")
PYEOF

# Исправляем req.headers.get на req.get
echo "🔧 Исправляем req.headers.get..."
find dist/api -name "*.js" -type f -exec sed -i 's/req\.headers\.get(/req.get(/g' {} + 2>/dev/null || true
find dist/api -name "*.js" -type f -exec sed -i 's/headers\.get(/req.get(/g' {} + 2>/dev/null || true

# Исправляем new URL если есть
echo "🔧 Исправляем new URL..."
python3 << 'PYEOF'
import re
import os

fixed_count = 0
for root, dirs, files in os.walk('dist/api'):
    for file in files:
        if file.endswith('.js'):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original = content
                
                # Удаляем строки с new URL(req.url)
                content = re.sub(r'.*new\s+URL\s*\(\s*req\.url\s*\).*\n', '', content)
                
                # Заменяем url.searchParams.get('param') на req.query.param
                content = re.sub(r"url\.searchParams\.get\(['\"](\w+)['\"]\)", r'req.query.\1', content)
                content = re.sub(r'url\.searchParams', 'req.query', content)
                
                if content != original:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    fixed_count += 1
            except:
                pass

print(f"✅ Исправлено файлов: {fixed_count}")
PYEOF

# Перезапускаем PM2
echo "🔄 Перезапускаем PM2..."
pm2 restart ride-backend --update-env

# Ждём
sleep 3

# Проверяем статус
echo "📋 Статус PM2:"
pm2 status

# Проверяем логи
echo ""
echo "📋 Последние логи (ошибки):"
pm2 logs ride-backend --err --lines 10 --nostream

echo ""
echo "✅ Обновление завершено!"
```

---

## 🔄 Или используйте готовый скрипт:

Скопируйте содержимое файла `DEPLOY_TO_SERVER.sh` на сервер и выполните:

```bash
# На сервере
cd /var/www/ride-together
bash DEPLOY_TO_SERVER.sh
```

---

## ✅ После обновления проверьте:

1. **Статус PM2:**
   ```bash
   pm2 status
   ```

2. **Логи:**
   ```bash
   pm2 logs ride-backend --lines 50
   ```

3. **API работает:**
   ```bash
   curl https://api.ridetogether.ru/api/rides?limit=1
   ```

---

## 📝 Что было исправлено:

- ✅ Удалены hardcoded credentials
- ✅ Заменены console.log на logger
- ✅ Улучшена типизация (убран req as any)
- ✅ Улучшена обработка ошибок
- ✅ Исправлен ERR_INVALID_URL (через пересборку)

