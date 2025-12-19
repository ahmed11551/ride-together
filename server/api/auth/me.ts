/**
 * API endpoint для получения текущего пользователя
 * Замена Supabase Auth.getUser()
 */

import { Request, Response } from 'express';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { db } from '../../utils/database.js';

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({ error: 'Токен не предоставлен' });
      return;
    }

    // Валидация токена
    const payload = verifyToken(token);

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Неверный токен' });
      return;
    }

    // Проверка сессии в БД
    const sessionResult = await db.query(
      'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (sessionResult.rows.length === 0) {
      res.status(401).json({ error: 'Сессия истекла' });
      return;
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
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    const user = userResult.rows[0];

    // Получение профиля для user_metadata
    const profileResult = await db.query(
      'SELECT full_name FROM profiles WHERE user_id = $1',
      [user.id]
    );

    const profile = profileResult.rows[0];

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: {
          full_name: profile?.full_name || null,
        },
        email_verified: user.email_verified,
        created_at: user.created_at,
      },
      token, // Возвращаем тот же токен для удобства
    });
  } catch (error: any) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Ошибка при получении пользователя' });
  }
}
