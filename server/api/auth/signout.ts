/**
 * API endpoint для выхода пользователя
 * Замена Supabase Auth.signOut()
 */

import { extractTokenFromHeader } from '../../utils/jwt';
import { db } from '../../utils/database';

export async function signOut(req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Токен не предоставлен' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Удаление сессии
    await db.query(
      'DELETE FROM sessions WHERE token = $1',
      [token]
    );

    return new Response(
      JSON.stringify({ message: 'Выход выполнен успешно' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Signout error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при выходе' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
