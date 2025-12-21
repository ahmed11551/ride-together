# 🔧 Исправление ERR_INVALID_URL

## Проблема:
```
ERR_INVALID_URL
input: '/api/rides?limit=10&status=active'
```

Это означает, что код пытается создать `new URL()` из относительного пути.

## Решение (выполните на сервере):

```bash
cd /var/www/ride-together/server

# Найти все использования new URL с req.url
grep -r "new URL(req.url" dist/

# Исправить через sed
find dist -name "*.js" -type f -exec sed -i '/const url = new URL(req\.url);/d' {} \;
find dist -name "*.js" -type f -exec sed -i '/let url = new URL(req\.url);/d' {} \;
find dist -name "*.js" -type f -exec sed -i 's/url\.searchParams\.get(/req.query/g' {} \;
find dist -name "*.js" -type f -exec sed -i 's/url\.searchParams/req.query/g' {} \;

# Перезапустить
pm2 restart ride-backend
pm2 logs ride-backend --err --lines 10 --nostream
```

## Или через Python (более точно):

```bash
cd /var/www/ride-together/server

python3 << 'EOF'
import re
import os

for root, dirs, files in os.walk('dist'):
    for file in files:
        if file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original = content
            
            # Удаляем строки с new URL(req.url)
            content = re.sub(r'const\s+url\s*=\s*new\s+URL\(req\.url\);?\s*\n', '', content)
            content = re.sub(r'let\s+url\s*=\s*new\s+URL\(req\.url\);?\s*\n', '', content)
            content = re.sub(r'var\s+url\s*=\s*new\s+URL\(req\.url\);?\s*\n', '', content)
            
            # Заменяем url.searchParams.get('param') на req.query.param
            content = re.sub(r"url\.searchParams\.get\('([^']+)'\)", r"req.query.\1", content)
            content = re.sub(r'url\.searchParams\.get\("([^"]+)"\)', r'req.query.\1', content)
            
            # Заменяем другие использования url.searchParams
            content = re.sub(r'url\.searchParams', 'req.query', content)
            
            if content != original:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"✅ Исправлено: {filepath}")

print("✅ Готово!")
EOF

pm2 restart ride-backend
pm2 logs ride-backend --err --lines 10 --nostream
```

