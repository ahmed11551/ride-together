/**
 * API endpoint для получения списка уведомлений пользователя
 * GET /api/notifications
 */

import { Request, Response } from 'express';
import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { logger } from '../../utils/logger.js';

export async function listNotifications(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const unreadOnly = req.query.unread === 'true';

    let query = `
      SELECT id, title, message, data, url, read, created_at, read_at
      FROM notifications
      WHERE user_id = $1
    `;
    const params: any[] = [payload.userId];

    if (unreadOnly) {
      query += ' AND read = false';
    }

    query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.status(200).json({
      notifications: result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        message: row.message,
        data: row.data,
        url: row.url,
        read: row.read,
        createdAt: row.created_at,
        readAt: row.read_at,
      })),
    });
  } catch (error: any) {
    logger.error('List notifications error', error, { userId: (req as any).userId });
    res.status(500).json({ error: 'Ошибка при получении уведомлений' });
  }
}

