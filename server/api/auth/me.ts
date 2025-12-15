/**
 * API endpoint для получения текущего пользователя
 * Замена Supabase Auth.getUser()
 */

import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';
import { db } from '../../utils/database';

export async function getCurrentUser(req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Токен не предоставлен' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Валидация токена
    const payload = verifyToken(token);

    if (!payload || !payload.userId) {
      return new Response(
        JSON.stringify({ error: 'Неверный токен' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Проверка сессии в БД
    const sessionResult = await db.query(
      'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (sessionResult.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Сессия истекла' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Обновление last_used_at
    await db.query(
      'UPDATE sessions SET last_used_at = NOW() WHERE token = $1',
      [token]
    );

    // Получение пользователя
    const userResult = await db.query(
      'SELECT id, email, email_verified, created_at FROM users WHERE id = $1',
      [payload.userId]
    );

    if (userResult.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Пользователь не найден' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = userResult.rows[0];

    // Получение профиля
    const profileResult = await db.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [user.id]
    );

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          email_verified: user.email_verified,
        },
        profile: profileResult.rows[0] || null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Get current user error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при получении пользователя' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
