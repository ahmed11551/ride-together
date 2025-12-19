/**
 * API endpoint для получения профиля
 * GET /api/profiles/:userId или GET /api/profiles/me
 */

import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { Request, Response } from 'express';


export async function getProfile(req: Request, res: Response, userId?: string): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    // Если userId не указан, используем текущего пользователя
    const targetUserId = userId || payload?.userId;

    if (!targetUserId) {
      res.status(401).json({ error: 'Не авторизован или userId не указан' });
      return;
    }

    const result = await db.query(
      `SELECT 
        id, user_id, full_name, phone, avatar_url, bio, rating, passenger_rating,
        trips_count, is_verified, created_at, updated_at, display_name, is_admin, is_banned
      FROM profiles WHERE user_id = $1`,
      [targetUserId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Профиль не найден' });
      return;
    }

    const profile = result.rows[0];

    res.status(200).json({
      id: profile.id,
      user_id: profile.user_id,
      full_name: profile.full_name,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      rating: parseFloat(profile.rating || '5.0'),
      passenger_rating: parseFloat(profile.passenger_rating || '5.0'),
      trips_count: profile.trips_count || 0,
      is_verified: profile.is_verified || false,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      display_name: profile.display_name,
      is_admin: profile.is_admin || false,
      is_banned: profile.is_banned || false,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Ошибка при получении профиля' });
  }
}

