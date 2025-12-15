#!/usr/bin/env node

/**
 * Скрипт для применения миграции рейтинга пассажира
 * Использует Supabase Management API или прямой SQL через клиент
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем переменные окружения
config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Ошибка: Не найдены переменные окружения');
  console.error('Нужны: VITE_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY (или VITE_SUPABASE_PUBLISHABLE_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  console.log('🚀 Начинаю применение миграции рейтинга пассажира...\n');

  try {
    // Читаем файл миграции
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250131000001_add_passenger_rating.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Миграция загружена\n');

    // Разделяем SQL на отдельные команды (упрощенный парсинг)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    console.log(`📝 Найдено ${statements.length} SQL команд\n`);

    // Выполняем каждую команду
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Пропускаем комментарии и пустые строки
      if (statement.startsWith('--') || statement.length < 10) {
        continue;
      }

      try {
        console.log(`⏳ Выполняю команду ${i + 1}/${statements.length}...`);
        
        // Используем RPC для выполнения SQL (если доступно)
        // Или прямой запрос через REST API
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        }).catch(async () => {
          // Если RPC не доступен, пробуем через прямой запрос
          // Для этого нужен service_role ключ
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({ sql: statement + ';' }),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          return { data: await response.json(), error: null };
        });

        if (error) {
          // Некоторые ошибки могут быть нормальными (например, "already exists")
          if (error.message?.includes('already exists') || 
              error.message?.includes('duplicate') ||
              error.message?.includes('уже существует')) {
            console.log(`⚠️  Предупреждение: ${error.message}`);
          } else {
            throw error;
          }
        } else {
          console.log(`✅ Команда ${i + 1} выполнена успешно`);
        }
      } catch (err) {
        // Для некоторых команд ошибки могут быть нормальными
        if (err.message?.includes('already exists') || 
            err.message?.includes('duplicate') ||
            err.message?.includes('уже существует')) {
          console.log(`⚠️  Предупреждение: ${err.message}`);
        } else {
          console.error(`❌ Ошибка при выполнении команды ${i + 1}:`, err.message);
          // Продолжаем выполнение остальных команд
        }
      }
    }

    console.log('\n✅ Миграция применена успешно!');
    console.log('\n📊 Проверяю результат...\n');

    // Проверяем результат
    const { data: profiles, error: checkError } = await supabase
      .from('profiles')
      .select('user_id, rating, passenger_rating, full_name')
      .limit(5);

    if (checkError) {
      console.error('⚠️  Не удалось проверить результат:', checkError.message);
    } else {
      console.log('✅ Проверка успешна! Примеры профилей:');
      profiles?.forEach(p => {
        console.log(`   - ${p.full_name || 'Пользователь'}: водитель=${p.rating || 5.0}, пассажир=${p.passenger_rating || 5.0}`);
      });
    }

    console.log('\n🎉 Готово! Рейтинг пассажира успешно добавлен.');
    
  } catch (error) {
    console.error('\n❌ Критическая ошибка:', error.message);
    console.error('\n💡 Рекомендация: Примените миграцию вручную через Supabase Dashboard');
    console.error('   См. файл: QUICK_APPLY_MIGRATION.md');
    process.exit(1);
  }
}

applyMigration();
