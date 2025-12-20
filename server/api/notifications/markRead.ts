/**
 * API endpoint для отметки уведомления как прочитанного
 * PUT /api/notifications/:id/read
 */

import { Request, Response } from 'express';
import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { logger } from '../../utils/logger.js';

export async function markNotificationRead(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const notificationId = req.params.id;

    // Проверяем, что уведомление принадлежит пользователю
    const checkResult = await db.query(
      'SELECT id FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, payload.userId]
    );

    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'Уведомление не найдено' });
      return;
    }

    // Отмечаем как прочитанное
    await db.query(
      'UPDATE notifications SET read = true, read_at = NOW() WHERE id = $1',
      [notificationId]
    );

    res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error('Mark notification read error', error, { userId: (req as any).userId });
    res.status(500).json({ error: 'Ошибка при обновлении уведомления' });
  }
}

