#!/bin/bash
# Скрипт для исправления __dirname в dist/index.js на сервере

set -e

cd /var/www/ride-together/server/dist || exit 1

echo "🔧 Исправление __dirname в dist/index.js..."

# Проверяем, существует ли файл
if [ ! -f index.js ]; then
    echo "❌ Файл dist/index.js не найден!"
    exit 1
fi

# Создаём Python скрипт для исправления
python3 << 'PYTHON_SCRIPT'
import re
import sys

file_path = 'index.js'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Проверяем, есть ли уже определение __dirname
    if 'let __dirname;' in content or 'const __dirname' in content and 'try {' in content:
        # Проверяем, используется ли path.join(__dirname
        if 'path.join(__dirname' in content:
            print("🔄 Заменяем path.join(__dirname на path.join(process.cwd()...")
            # Заменяем все path.join(__dirname на path.join(process.cwd()
            content = content.replace('path.join(__dirname,', 'path.join(process.cwd(),')
            modified = True
        else:
            print("✅ __dirname уже исправлен, но проверяем использование...")
            modified = False
    else:
        print("🔧 Добавляем определение __dirname...")
        # Ищем место после импортов для добавления __dirname
        # Обычно это после import statements и перед использованием
        dirname_code = '''import { fileURLToPath } from 'url';
import { dirname } from 'path';

let __dirname;
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = dirname(__filename);
} catch {
  __dirname = process.cwd();
}
'''
        
        # Проверяем, есть ли уже импорты fileURLToPath и dirname
        if 'fileURLToPath' not in content:
            # Находим место после всех импортов (после первой строки с точкой с запятой после импорта)
            # Ищем паттерн: последний import statement
            import_pattern = r"(import\s+[^;]+;[\s\n]*)+"
            matches = list(re.finditer(import_pattern, content))
            if matches:
                last_import = matches[-1]
                insert_pos = last_import.end()
                content = content[:insert_pos] + '\n' + dirname_code + content[insert_pos:]
            else:
                # Если нет импортов, добавляем в начало после комментариев
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    if line.strip().startswith('import') or (i > 0 and lines[i-1].strip().startswith('import')):
                        continue
                    if line.strip() and not line.strip().startswith('//') and not line.strip().startswith('/*'):
                        lines.insert(i, dirname_code)
                        break
                content = '\n'.join(lines)
        else:
            # Если импорты уже есть, просто добавляем определение __dirname после них
            dirname_def = '''let __dirname;
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = dirname(__filename);
} catch {
  __dirname = process.cwd();
}
'''
            # Находим место после импортов fileURLToPath и dirname
            if 'fileURLToPath' in content and 'import' in content:
                import_end = content.find('import { dirname }')
                if import_end != -1:
                    # Находим конец этого импорта (после ;)
                    semicolon = content.find(';', import_end)
                    if semicolon != -1:
                        content = content[:semicolon+1] + '\n\n' + dirname_def + content[semicolon+1:]
        
        # Заменяем path.join(__dirname на path.join(process.cwd()
        if 'path.join(__dirname' in content:
            content = content.replace('path.join(__dirname,', 'path.join(process.cwd(),')
        
        modified = True
    
    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ __dirname исправлен в dist/index.js")
    else:
        print("✅ Файл уже исправлен")
        
    # Проверяем синтаксис
    import subprocess
    result = subprocess.run(['node', '--check', file_path], capture_output=True, text=True)
    if result.returncode == 0:
        print("✅ Синтаксис правильный!")
    else:
        print("❌ Синтаксическая ошибка:")
        print(result.stderr)
        sys.exit(1)

except Exception as e:
    print(f"❌ Ошибка: {e}")
    sys.exit(1)
PYTHON_SCRIPT

echo ""
echo "✅ Исправление завершено!"
