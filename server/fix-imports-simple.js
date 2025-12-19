#!/usr/bin/env node
/**
 * Простой скрипт для исправления импортов в уже скомпилированных файлах
 * Можно запустить прямо на сервере без пересборки
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fixFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    
    // Заменяем импорты без .js на импорты с .js
    // Паттерн: from './path' -> from './path.js'
    // Но не трогаем уже существующие .js и не трогаем node_modules импорты
    let fixed = content.replace(
      /from\s+(['"])(\.\.?\/[^'"]+?)(\1)/g,
      (match, quote, path) => {
        // Пропускаем если уже есть .js
        if (path.endsWith('.js')) return match;
        // Пропускаем если путь заканчивается на /
        if (path.endsWith('/')) return match;
        // Добавляем .js
        return `from ${quote}${path}.js${quote}`;
      }
    );
    
    if (fixed !== content) {
      await writeFile(filePath, fixed, 'utf-8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error: ${filePath}`, error.message);
    return false;
  }
}

async function processDir(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    let fixed = 0;
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        fixed += await processDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        if (await fixFile(fullPath)) {
          fixed++;
        }
      }
    }
    
    return fixed;
  } catch (error) {
    console.error(`❌ Error processing dir: ${dir}`, error.message);
    return 0;
  }
}

async function main() {
  const distDir = process.argv[2] || join(__dirname, 'dist');
  console.log(`🔧 Fixing imports in: ${distDir}`);
  
  const fixed = await processDir(distDir);
  console.log(`\n✅ Fixed ${fixed} files!`);
}

main().catch(console.error);

