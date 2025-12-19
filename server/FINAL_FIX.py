#!/usr/bin/env python3
# ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ - добавляем определение __dirname перед его использованием

import sys
import os

os.chdir('/var/www/ride-together/server/dist')

print("=== ТЕКУЩЕЕ СОСТОЯНИЕ (строки 1-15) ===")
with open('index.js', 'r') as f:
    lines = f.readlines()

for i in range(min(15, len(lines))):
    print(f"{i+1:3}: {lines[i].rstrip()}")

print("\n=== ИСПРАВЛЕНИЕ ===")

# Ищем где импорты заканчиваются и где начинается использование __dirname
new_lines = []
i = 0
dirname_added = False

# Проходим по строкам
while i < len(lines):
    line = lines[i]
    
    # Добавляем определение __dirname после всех импортов, но перед первым использованием
    if not dirname_added and ('__dirname' in line or (i > 0 and 'import' not in lines[i-1] and 'import' in lines[max(0, i-5)])):
        # Проверяем есть ли уже импорты fileURLToPath и dirname
        has_file_url = any('fileURLToPath' in l for l in lines[:i])
        has_dirname = any('dirname' in l and 'from' in l for l in lines[:i])
        
        # Если используются __dirname но нет определения, добавляем перед первой строкой где используется
        if '__dirname' in line and not dirname_added:
            print(f"✅ Найдено использование __dirname на строке {i+1}")
            
            # Добавляем импорты если их нет
            import_idx = 0
            for j in range(i):
                if 'import' in lines[j]:
                    import_idx = j + 1
            
            # Вставляем после импортов
            if not has_file_url:
                new_lines.insert(import_idx, "import { fileURLToPath } from 'url';\n")
                import_idx += 1
            if not has_dirname:
                new_lines.insert(import_idx, "import { dirname } from 'path';\n")
                import_idx += 1
            
            # Вставляем определение __dirname перед строкой где используется
            new_lines.append('let __dirname;\n')
            new_lines.append('try {\n')
            new_lines.append('  const __filename = fileURLToPath(import.meta.url);\n')
            new_lines.append('  __dirname = dirname(__filename);\n')
            new_lines.append('} catch {\n')
            new_lines.append('  __dirname = process.cwd();\n')
            new_lines.append('}\n')
            new_lines.append('\n')
            dirname_added = True
            print("✅ Добавлено определение __dirname")
            continue
    
    new_lines.append(line)
    i += 1

# Если не нашли где добавить, добавляем в начало после импортов
if not dirname_added:
    print("⚠️  Не нашли использование __dirname, добавляем после импортов...")
    import_end = 0
    for i, line in enumerate(lines):
        if 'import' in line:
            import_end = i + 1
    
    final_lines = lines[:import_end]
    
    # Добавляем импорты если их нет
    if not any('fileURLToPath' in l for l in final_lines):
        final_lines.append("import { fileURLToPath } from 'url';\n")
    if not any('dirname' in l and 'from' in l for l in final_lines):
        final_lines.append("import { dirname } from 'path';\n")
    
    # Добавляем определение
    final_lines.append('\n')
    final_lines.append('let __dirname;\n')
    final_lines.append('try {\n')
    final_lines.append('  const __filename = fileURLToPath(import.meta.url);\n')
    final_lines.append('  __dirname = dirname(__filename);\n')
    final_lines.append('} catch {\n')
    final_lines.append('  __dirname = process.cwd();\n')
    final_lines.append('}\n')
    final_lines.append('\n')
    
    # Добавляем остальные строки
    final_lines.extend(lines[import_end:])
    new_lines = final_lines

# Сохраняем
with open('index.js', 'w') as f:
    f.writelines(new_lines)

print("✅ Файл исправлен!")

print("\n=== РЕЗУЛЬТАТ (строки 1-20) ===")
with open('index.js', 'r') as f:
    result = f.readlines()
    for i in range(min(20, len(result))):
        print(f"{i+1:3}: {result[i].rstrip()}")

