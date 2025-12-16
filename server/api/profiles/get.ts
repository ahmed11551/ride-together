/**
 * API endpoint для получения профиля
 * GET /api/profiles/:userId или GET /api/profiles/me
 */

import { db } from '../../utils/database';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';

export async function getProfile(req: Request, userId?: string): Promise<Response> {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    // Если userId не указан, используем текущего пользователя
    const targetUserId = userId || payload?.userId;

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'Не авторизован или userId не указан' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await db.query(
      `SELECT 
        id, user_id, full_name, phone, avatar_url, bio, rating, passenger_rating,
        trips_count, is_verified, created_at, updated_at, display_name, is_admin, is_banned
      FROM profiles WHERE user_id = $1`,
      [targetUserId]
    );

    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Профиль не найден' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const profile = result.rows[0];

    return new Response(
      JSON.stringify({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        rating: parseFloat(profile.rating || '5.0'),
        passenger_rating: profile.passenger_rating ? parseFloat(profile.passenger_rating) : undefined,
        trips_count: profile.trips_count || 0,
        is_verified: profile.is_verified || false,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        display_name: profile.display_name,
        is_admin: profile.is_admin || false,
        is_banned: profile.is_banned || false,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Get profile error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при получении профиля' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

