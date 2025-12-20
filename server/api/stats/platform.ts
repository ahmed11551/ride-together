/**
 * API endpoint для получения статистики платформы (admin only)
 * GET /api/stats/platform
 */

import { Request, Response } from 'express';
import { statsService } from '../../services/statsService.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { db } from '../../utils/database.js';
import { logger } from '../../utils/logger.js';

export async function getPlatformStats(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    // Проверяем, что пользователь - администратор
    const userResult = await db.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [payload.userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_admin) {
      res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора' });
      return;
    }

    const stats = await statsService.getPlatformStats();
    res.status(200).json(stats);
  } catch (error: any) {
    logger.error('Get platform stats error', error, { userId: (req as any).userId });
    res.status(500).json({ error: 'Ошибка при получении статистики' });
  }
}

