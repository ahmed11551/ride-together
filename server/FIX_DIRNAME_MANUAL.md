# 🔧 Ручное исправление __dirname

## Проблема:
Ошибка на строке 10 в `dist/index.js`: `ReferenceError: __dirname is not defined`

## Решение:

### Вариант 1: Посмотреть что на строке 10 и исправить вручную

```bash
cd /var/www/ride-together/server

# Посмотреть проблемные строки
head -15 dist/index.js | cat -n

# Открыть файл для редактирования
nano dist/index.js

# Найти строку 10 и посмотреть что там
# Если там __dirname - заменить на process.cwd()
# Если там определение __dirname - удалить эти строки

# Сохранить: Ctrl+O, Enter
# Выйти: Ctrl+X
```

### Вариант 2: Исправить через Python (более надежно)

```bash
cd /var/www/ride-together/server

python3 << 'EOF'
import re

with open('dist/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Удаляем определения __dirname
patterns = [
    r'const\s+__filename\s*=\s*fileURLToPath\(import\.meta\.url\);\s*\n',
    r'const\s+__dirname\s*=\s*dirname\(__filename\);\s*\n',
    r'let\s+__filename\s*=\s*fileURLToPath\(import\.meta\.url\);\s*\n',
    r'let\s+__dirname\s*=\s*dirname\(__filename\);\s*\n',
    r'const\s+__dirname\s*=\s*dirname\(fileURLToPath\(import\.meta\.url\)\);\s*\n',
]

for pattern in patterns:
    content = re.sub(pattern, '', content, flags=re.MULTILINE)

# Заменяем path.join(__dirname на path.join(process.cwd()
content = re.sub(r'path\.join\(__dirname', 'path.join(process.cwd()', content)

# Заменяем оставшиеся __dirname на process.cwd()
content = re.sub(r'__dirname', 'process.cwd()', content)

with open('dist/index.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Исправлено!")
EOF

pm2 restart ride-backend
pm2 logs ride-backend --err --lines 10 --nostream
```

### Вариант 3: Пересобрать проект

```bash
cd /var/www/ride-together/server
rm -rf dist/
npm run build

# После компиляции исправить
sed -i 's/path\.join(__dirname/path.join(process.cwd()/g' dist/index.js
sed -i '/const __filename = fileURLToPath(import\.meta\.url);/d' dist/index.js
sed -i '/const __dirname = dirname(__filename);/d' dist/index.js
sed -i 's/__dirname/process.cwd()/g' dist/index.js

pm2 restart ride-backend
```

