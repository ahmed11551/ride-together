/**
 * API endpoint для отметки всех уведомлений как прочитанных
 * PUT /api/notifications/read-all
 */

import { Request, Response } from 'express';
import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { logger } from '../../utils/logger.js';

export async function markAllNotificationsRead(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    // Отмечаем все как прочитанные
    await db.query(
      'UPDATE notifications SET read = true, read_at = NOW() WHERE user_id = $1 AND read = false',
      [payload.userId]
    );

    res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error('Mark all notifications read error', error, { userId: (req as any).userId });
    res.status(500).json({ error: 'Ошибка при обновлении уведомлений' });
  }
}

