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
      // Шаг 1: Заменяем все path.join(__dirname на path.join(process.cwd()
      if (content.includes('path.join(__dirname')) {
        content = content.replace(/path\.join\(__dirname/g, 'path.join(process.cwd()');
        modified = true;
        console.log(`✅ Fixed path.join(__dirname in: ${filePath}`);
      }
      
      // Шаг 2: Заменяем просто __dirname на process.cwd() везде где используется
      // Но избегаем замены в определениях (let/const __dirname)
      if (content.includes('__dirname')) {
        // Сначала удаляем проблемные определения
        const problematicDefs = [
          /const\s+__filename\s*=\s*fileURLToPath\(import\.meta\.url\);\s*const\s+__dirname\s*=\s*dirname\(__filename\);/g,
          /let\s+__filename\s*=\s*fileURLToPath\(import\.meta\.url\);\s*let\s+__dirname\s*=\s*dirname\(__filename\);/g,
          /const\s+__dirname\s*=\s*dirname\(fileURLToPath\(import\.meta\.url\)\);/g,
          /let\s+__dirname\s*=\s*dirname\(fileURLToPath\(import\.meta\.url\)\);/g,
        ];
        
        for (const pattern of problematicDefs) {
          if (pattern.test(content)) {
            content = content.replace(pattern, '');
            modified = true;
            console.log(`✅ Removed problematic __dirname definition in: ${filePath}`);
          }
        }
        
        // Теперь заменяем оставшиеся использования __dirname на process.cwd()
        // Используем более точный паттерн, чтобы не трогать строки/комментарии
        const dirnameUsagePattern = /([^a-zA-Z_'"`])__dirname([^a-zA-Z_'"`])/g;
        if (dirnameUsagePattern.test(content)) {
          content = content.replace(dirnameUsagePattern, '$1process.cwd()$2');
          modified = true;
          console.log(`✅ Replaced __dirname with process.cwd() in: ${filePath}`);
        }
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

