/**
 * Утилиты для работы с профилями пользователей
 */

import { db } from './database.js';

/**
 * Создание профиля пользователя
 */
export async function createProfile(userId: string, fullName: string): Promise<void> {
  await db.query(
    `INSERT INTO profiles (user_id, full_name, rating, passenger_rating, trips_count, is_verified, created_at, updated_at)
     VALUES ($1, $2, 5.0, 5.0, 0, false, NOW(), NOW())
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, fullName]
  );
}

/**
 * Обновление профиля пользователя
 */
export async function updateProfile(
  userId: string,
  updates: {
    full_name?: string;
    phone?: string;
    bio?: string;
    avatar_url?: string;
  }
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.full_name !== undefined) {
    fields.push(`full_name = $${paramIndex++}`);
    values.push(updates.full_name);
  }
  if (updates.phone !== undefined) {
    fields.push(`phone = $${paramIndex++}`);
    values.push(updates.phone);
  }
  if (updates.bio !== undefined) {
    fields.push(`bio = $${paramIndex++}`);
    values.push(updates.bio);
  }
  if (updates.avatar_url !== undefined) {
    fields.push(`avatar_url = $${paramIndex++}`);
    values.push(updates.avatar_url);
  }

  if (fields.length === 0) return;

  fields.push(`updated_at = NOW()`);
  values.push(userId);

  await db.query(
    `UPDATE profiles SET ${fields.join(', ')} WHERE user_id = $${paramIndex}`,
    values
  );
}
