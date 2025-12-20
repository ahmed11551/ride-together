/**
 * API endpoint для получения статистики пользователя
 * GET /api/stats/user
 */

import { Request, Response } from 'express';
import { statsService } from '../../services/statsService.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { logger } from '../../utils/logger.js';

export async function getUserStats(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const stats = await statsService.getUserStats(payload.userId);
    res.status(200).json(stats);
  } catch (error: any) {
    logger.error('Get user stats error', error, { userId: (req as any).userId });
    res.status(500).json({ error: 'Ошибка при получении статистики' });
  }
}

