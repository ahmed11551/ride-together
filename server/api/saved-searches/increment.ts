/**
 * API endpoint для обновления last_searched_at при использовании сохранённого поиска
 * POST /api/saved-searches/:id/increment
 */

import { Request, Response } from 'express';
import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { logger } from '../../utils/logger.js';

export async function incrementSavedSearchUsage(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const searchId = req.params.id;

    // Обновляем last_searched_at
    const result = await db.query(
      'UPDATE saved_searches SET last_searched_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id',
      [searchId, payload.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Поиск не найден' });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error('Increment saved search usage error', error, { userId: (req as any).userId });
    res.status(500).json({ error: 'Ошибка при обновлении поиска' });
  }
}

