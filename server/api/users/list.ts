/**
 * API endpoint для получения списка всех пользователей (admin only)
 * GET /api/users
 */

import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { Request, Response } from 'express';


export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    // Проверяем, является ли пользователь админом
    const adminCheck = await db.query(
      'SELECT is_admin FROM profiles WHERE user_id = $1',
      [payload.userId]
    );

    if (!adminCheck.rows[0]?.is_admin) {
      res.status(403).json({ error: 'Доступ запрещен' });
      return;
    }

    // Получаем всех пользователей с их профилями
    const result = await db.query(
      `SELECT 
        user_id,
        full_name,
        phone,
        avatar_url,
        rating,
        passenger_rating,
        trips_count,
        is_verified,
        is_admin,
        is_banned,
        created_at
      FROM profiles
      ORDER BY created_at DESC`
    );

    const users = result.rows.map(row => ({
      user_id: row.user_id,
      full_name: row.full_name,
      email: null, // Email не хранится в profiles, только в auth.users (для будущего)
      phone: row.phone,
      avatar_url: row.avatar_url,
      rating: parseFloat(row.rating || '5.0'),
      trips_count: row.trips_count || 0,
      is_verified: row.is_verified || false,
      is_admin: row.is_admin || false,
      is_banned: row.is_banned || false,
      created_at: row.created_at,
    }));

      res.status(200).json(users);
      return;
  } catch (error: any) {
    console.error('List users error:', error);
      res.status(500).json({ error: 'Ошибка при получении списка пользователей' });
      return;
  }
}

