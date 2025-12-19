#!/usr/bin/env node
/**
 * Скрипт для исправления импортов в скомпилированных файлах
 * Добавляет .js расширения к относительным импортам для ESM
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fixImportsInFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf-8');
    let modified = false;
    
    // Исправляем __dirname для ESM (если это index.js)
    if (filePath.endsWith('/index.js')) {
      const oldDirnamePattern = /const __filename = fileURLToPath\(import\.meta\.url\);\s*const __dirname = dirname\(__filename\);/;
      const newDirnameCode = `let __dirname;
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = dirname(__filename);
} catch {
  __dirname = process.cwd();
}`;
      
      if (oldDirnamePattern.test(content)) {
        content = content.replace(oldDirnamePattern, newDirnameCode);
        modified = true;
        console.log(`✅ Fixed __dirname in: ${filePath}`);
      }
    }
    
    // Паттерн для поиска импортов без .js расширения
    // Ищем: import ... from './path' или import ... from '../path'
    // Но не трогаем: import ... from './path.js' или import ... from 'package'
    const importPattern = /from\s+(['"])(\.\.?\/[^'"]+?)(\1)/g;
    
    const fixedContent = content.replace(importPattern, (match, quote, importPath) => {
      // Пропускаем если уже есть расширение .js или это не относительный путь
      if (importPath.endsWith('.js') || !importPath.startsWith('.')) {
        return match;
      }
      
      // Пропускаем если путь заканчивается на / (директория)
      if (importPath.endsWith('/')) {
        return match;
      }
      
      // Добавляем .js если его нет
      modified = true;
      return `from ${quote}${importPath}.js${quote}`;
    });
    
    if (modified) {
      await writeFile(filePath, fixedContent, 'utf-8');
      console.log(`✅ Fixed imports in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function processDirectory(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        await fixImportsInFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error processing directory ${dir}:`, error.message);
  }
}

async function main() {
  const distDir = join(__dirname, 'dist');
  console.log(`🔧 Fixing imports in ${distDir}...`);
  await processDirectory(distDir);
  console.log('✅ Done fixing imports!');
}

main().catch(console.error);

