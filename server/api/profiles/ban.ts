/**
 * API endpoint для блокировки/разблокировки пользователя (только для админов)
 * PUT /api/profiles/:userId/ban
 */

import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { Request, Response } from 'express';


export async function banUser(req: Request, res: Response, userId: string): Promise<void> {
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

    const body = req.body as { is_banned?: boolean };
    const { is_banned } = body;

    if (typeof is_banned !== 'boolean') {
      res.status(400).json({ error: 'is_banned должен быть boolean' });
      return;
    }

    const result = await db.query(
      'UPDATE profiles SET is_banned = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *',
      [is_banned, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    const profile = result.rows[0];

    res.status(200).json({
      id: profile.id,
      user_id: profile.user_id,
      is_banned: profile.is_banned,
    });
  } catch (error: any) {
    console.error('Ban user error:', error);
      res.status(500).json({ error: 'Ошибка при блокировке пользователя' });
      return;
  }
}

