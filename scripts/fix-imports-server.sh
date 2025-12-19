#!/bin/bash
# Скрипт для исправления импортов на сервере
# Добавляет .js расширения ко всем локальным импортам

cd /var/www/ride-together/server

echo "Исправляю импорты в TypeScript файлах..."

# Найдем все .ts файлы и исправим импорты
find . -name "*.ts" -type f | while read file; do
    # Пропустим node_modules и dist
    if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"dist"* ]]; then
        continue
    fi
    
    echo "Обрабатываю: $file"
    
    # Создадим временный файл
    temp_file="${file}.tmp"
    
    # Исправим импорты:
    # from './path' -> from './path.js'
    # from '../path' -> from '../path.js'
    # Но только если не заканчивается уже на .js
    sed -E "s|from '(\\.\\.?/[^']+)(?<!\.js)'|from '\1.js'|g" "$file" > "$temp_file"
    
    # Альтернативный метод - более простой
    # Заменим все from './path'; на from './path.js';
    sed -E "s|from '(\\.\\.?/[^']+)';|from '\1.js';|g" "$file" > "$temp_file"
    
    # Заменим оригинальный файл
    mv "$temp_file" "$file"
done

echo "Готово! Теперь выполните: npm run build"

