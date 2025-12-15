#!/usr/bin/env node

/**
 * Упрощенный скрипт для применения миграции
 * Использует Supabase REST API напрямую
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Ошибка: Не найдены переменные окружения');
  console.error('Нужны: VITE_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 Для применения миграции через скрипт нужен SERVICE_ROLE ключ');
  console.error('   Его можно найти в Supabase Dashboard → Settings → API → service_role key');
  console.error('\n📋 Альтернатива: Примените миграцию вручную через Supabase Dashboard');
  console.error('   См. файл: QUICK_APPLY_MIGRATION.md');
  process.exit(1);
}

async function applyMigration() {
  console.log('🚀 Применение миграции рейтинга пассажира\n');
  console.log('⚠️  ВНИМАНИЕ: Этот скрипт требует SERVICE_ROLE ключ для выполнения SQL');
  console.log('   Если у вас нет SERVICE_ROLE ключа, примените миграцию вручную\n');

  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250131000001_add_passenger_rating.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('📄 Миграция загружена');
  console.log(`📝 Размер: ${migrationSQL.length} символов\n`);

  // Для выполнения SQL через REST API нужна специальная функция в Supabase
  // Или можно использовать Supabase CLI
  console.log('💡 Рекомендуемый способ применения:');
  console.log('   1. Откройте Supabase Dashboard');
  console.log('   2. Перейдите в SQL Editor');
  console.log('   3. Скопируйте содержимое файла миграции');
  console.log('   4. Вставьте и выполните\n');

  console.log('📁 Файл миграции:', migrationPath);
  console.log('\n✅ Скрипт готов. Примените миграцию через Supabase Dashboard.');
}

applyMigration();
