/**
 * API endpoint для обновления профиля
 * PUT /api/profiles/me
 */

import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { Request, Response } from 'express';


export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const body = req.body as Record<string, any>;
    const updates: any = {};

    // Разрешенные поля для обновления
    const allowedFields = ['full_name', 'phone', 'bio', 'avatar_url'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'Нет полей для обновления' });
      return;
    }

    // Если обновляется full_name, обновляем и display_name
    if (updates.full_name) {
      updates.display_name = updates.full_name;
    }

    updates.updated_at = new Date();

    // Проверяем, существует ли профиль
    const existingProfile = await db.query(
      'SELECT id FROM profiles WHERE user_id = $1',
      [payload.userId]
    );

    if (existingProfile.rows.length === 0) {
      // Создаем профиль, если не существует
      const defaultName = updates.full_name || payload.email?.split('@')[0] || 'Пользователь';
      const result = await db.query(
        `INSERT INTO profiles (id, user_id, full_name, display_name, phone, bio, avatar_url, rating, passenger_rating, trips_count, is_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           display_name = EXCLUDED.display_name,
           phone = EXCLUDED.phone,
           bio = EXCLUDED.bio,
           avatar_url = EXCLUDED.avatar_url,
           updated_at = NOW()
         RETURNING *`,
        [
          payload.userId,
          payload.userId,
          updates.full_name || defaultName,
          updates.display_name || defaultName,
          updates.phone || null,
          updates.bio || null,
          updates.avatar_url || null,
          5.0,
          5.0,
          0,
          false,
        ]
      );

      const profile = result.rows[0];
      res.status(200).json({ id: profile.id, user_id: profile.user_id, full_name: profile.full_name, phone: profile.phone, avatar_url: profile.avatar_url, bio: profile.bio, rating: parseFloat(profile.rating) });
      return;
    }

    // Обновляем существующий профиль
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const result = await db.query(
      `UPDATE profiles SET ${setClause} WHERE user_id = $1 RETURNING *`,
      [payload.userId, ...Object.values(updates)]
    );

    const profile = result.rows[0];

      res.status(200).json({ id: profile.id, user_id: profile.user_id, full_name: profile.full_name, phone: profile.phone, avatar_url: profile.avatar_url, bio: profile.bio, rating: parseFloat(profile.rating) });
      return;
  } catch (error: any) {
    console.error('Update profile error:', error);
      res.status(500).json({ error: 'Ошибка при обновлении профиля' });
      return;
  }
}

