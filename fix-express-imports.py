#!/usr/bin/env python3
"""
Скрипт для автоматического исправления импортов и использования Express Request/Response
"""

import re
import os
from pathlib import Path

def fix_file(file_path):
    """Исправляет один файл API"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # 1. Добавляем импорт Request, Response из express если его нет
    if 'import { Request, Response }' not in content and 'from \'express\'' not in content:
        # Находим последний import
        import_pattern = r'(import .+ from [\'"].+[\'"];)'
        imports = re.findall(import_pattern, content)
        if imports:
            last_import = imports[-1]
            new_import = "import { Request, Response } from 'express';\n"
            content = content.replace(last_import, last_import + '\n' + new_import)
        else:
            # Если нет импортов, добавляем в начало после комментариев
            lines = content.split('\n')
            insert_idx = 0
            for i, line in enumerate(lines):
                if line.strip().startswith('import '):
                    insert_idx = i
                    break
            lines.insert(insert_idx, "import { Request, Response } from 'express';")
            content = '\n'.join(lines)
    
    # 2. Исправляем сигнатуру функции
    content = re.sub(
        r'export async function (\w+)\(req: Request\): Promise<Response>',
        r'export async function \1(req: Request, res: Response): Promise<void>',
        content
    )
    
    # 3. Исправляем req.headers.get() на req.headers['header'] или req.get()
    content = re.sub(
        r"req\.headers\.get\(['\"]([^'\"]+)['\"]\)",
        r"req.headers['\1'] as string | undefined",
        content
    )
    
    # 4. Исправляем await req.json() на req.body
    content = re.sub(
        r'await req\.json\(\)',
        'req.body',
        content
    )
    content = re.sub(
        r'const body = await req\.json\(\);',
        'const body = req.body;',
        content
    )
    content = re.sub(
        r"const \{ (.+) \} = await req\.json\(\);",
        r"const { \1 } = req.body;",
        content
    )
    
    # 5. Исправляем req.url на правильное использование для Express
    # В Express req.url уже есть, но для создания URL может понадобиться req.protocol + req.get('host') + req.url
    # Пока оставляем как есть, но можем исправить если нужно
    
    # 6. Исправляем return new Response(...) на res.status().json()
    # Это сложнее, так как нужно парсить структуру Response
    
    # Простые случаи - return new Response(JSON.stringify(...), { status: XXX })
    pattern = r'return new Response\(\s*JSON\.stringify\(([^)]+)\),\s*\{\s*status:\s*(\d+)[^}]*\}\s*\);'
    def replace_response(match):
        json_content = match.group(1)
        status = match.group(2)
        return f'res.status({status}).json({json_content});'
    content = re.sub(pattern, replace_response, content, flags=re.DOTALL)
    
    # Еще один паттерн для return new Response
    pattern2 = r'return new Response\(\s*JSON\.stringify\(\{([^}]+)\}\),\s*\{\s*status:\s*(\d+)[^}]*\}\s*\);'
    def replace_response2(match):
        json_content = '{' + match.group(1) + '}'
        status = match.group(2)
        return f'res.status({status}).json({json_content});'
    content = re.sub(pattern2, replace_response2, content, flags=re.DOTALL)
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Исправлен: {file_path}")
        return True
    else:
        print(f"⏭️  Пропущен (без изменений): {file_path}")
        return False

if __name__ == '__main__':
    server_dir = Path(__file__).parent / 'server' / 'api'
    
    if not server_dir.exists():
        print(f"❌ Директория не найдена: {server_dir}")
        exit(1)
    
    # Находим все .ts файлы
    ts_files = list(server_dir.rglob('*.ts'))
    
    fixed = 0
    for ts_file in ts_files:
        if fix_file(ts_file):
            fixed += 1
    
    print(f"\n✅ Исправлено файлов: {fixed}/{len(ts_files)}")

