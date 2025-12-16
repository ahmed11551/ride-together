/**
 * API endpoint для блокировки/разблокировки пользователя (только для админов)
 * PUT /api/profiles/:userId/ban
 */

import { db } from '../../utils/database';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';

export async function banUser(req: Request, userId: string): Promise<Response> {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      return new Response(
        JSON.stringify({ error: 'Не авторизован' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Проверяем, является ли пользователь админом
    const adminCheck = await db.query(
      'SELECT is_admin FROM profiles WHERE user_id = $1',
      [payload.userId]
    );

    if (!adminCheck.rows[0]?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Доступ запрещен' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { is_banned } = body;

    if (typeof is_banned !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'is_banned должен быть boolean' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await db.query(
      'UPDATE profiles SET is_banned = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *',
      [is_banned, userId]
    );

    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Пользователь не найден' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const profile = result.rows[0];

    return new Response(
      JSON.stringify({
        id: profile.id,
        user_id: profile.user_id,
        is_banned: profile.is_banned,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Ban user error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при блокировке пользователя' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
