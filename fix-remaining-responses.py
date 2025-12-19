#!/usr/bin/env python3
"""
Скрипт для исправления оставшихся return new Response на res.status().json()
"""

import re
from pathlib import Path

def fix_responses(file_path):
    """Исправляет все return new Response в файле"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Паттерн 1: return new Response(JSON.stringify(...), { status: XXX })
    pattern1 = r'return new Response\(\s*JSON\.stringify\(([^)]+)\),\s*\{\s*status:\s*(\d+)[^}]*\}\s*\);'
    
    def replace1(match):
        json_content = match.group(1).strip()
        status = match.group(2)
        # Убираем лишние пробелы и переносы строк
        json_content = ' '.join(json_content.split())
        return f'res.status({status}).json({json_content});\n      return;'
    
    content = re.sub(pattern1, replace1, content, flags=re.DOTALL | re.MULTILINE)
    
    # Паттерн 2: многострочный return new Response
    lines = content.split('\n')
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Если начинается с return new Response(
        if 'return new Response(' in line:
            # Собираем весь блок до закрывающей скобки
            block = [line]
            i += 1
            open_count = line.count('(') - line.count(')')
            
            while i < len(lines) and open_count > 0:
                block.append(lines[i])
                open_count += lines[i].count('(') - lines[i].count(')')
                i += 1
            
            block_text = '\n'.join(block)
            
            # Пытаемся извлечь JSON и status
            json_match = re.search(r'JSON\.stringify\(([\s\S]*?)\)', block_text, re.DOTALL)
            status_match = re.search(r'status:\s*(\d+)', block_text)
            
            if json_match and status_match:
                json_content = json_match.group(1).strip()
                status = status_match.group(1)
                
                # Упрощаем json_content если это просто объект
                json_content = re.sub(r'\s+', ' ', json_content)
                
                new_block = f'res.status({status}).json({json_content});\n      return;'
                new_lines.append(new_block)
            else:
                # Если не удалось распарсить, оставляем как есть
                new_lines.extend(block)
        else:
            new_lines.append(line)
            i += 1
    
    content = '\n'.join(new_lines)
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Исправлен: {file_path}")
        return True
    else:
        print(f"⏭️  Без изменений: {file_path}")
        return False

if __name__ == '__main__':
    server_dir = Path(__file__).parent / 'server' / 'api'
    
    # Список файлов, которые нужно исправить
    files_to_fix = list(server_dir.rglob('*.ts'))
    
    fixed = 0
    for ts_file in files_to_fix:
        if fix_responses(ts_file):
            fixed += 1
    
    print(f"\n✅ Исправлено файлов: {fixed}/{len(files_to_fix)}")

