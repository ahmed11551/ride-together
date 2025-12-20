/**
 * API endpoint для получения текущего местоположения пользователя
 * GET /api/location
 */

import { Request, Response } from 'express';
import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { logger } from '../../utils/logger.js';

export async function getUserLocation(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const result = await db.query(
      'SELECT lat, lng, accuracy, updated_at FROM user_locations WHERE user_id = $1',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Местоположение не найдено' });
      return;
    }

    const location = result.rows[0];
    res.status(200).json({
      lat: parseFloat(location.lat),
      lng: parseFloat(location.lng),
      accuracy: location.accuracy ? parseFloat(location.accuracy) : null,
      updatedAt: location.updated_at,
    });
  } catch (error: any) {
    logger.error('Get user location error', error, { userId: (req as any).userId });
    res.status(500).json({ error: 'Ошибка при получении местоположения' });
  }
}

