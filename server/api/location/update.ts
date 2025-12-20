/**
 * API endpoint для обновления текущего местоположения пользователя
 * POST /api/location
 */

import { Request, Response } from 'express';
import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { logger } from '../../utils/logger.js';

export async function updateUserLocation(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const body = req.body as {
      lat: number;
      lng: number;
      accuracy?: number;
      timestamp?: string;
    };

    if (typeof body.lat !== 'number' || typeof body.lng !== 'number') {
      res.status(400).json({ error: 'lat и lng обязательны и должны быть числами' });
      return;
    }

    if (body.lat < -90 || body.lat > 90 || body.lng < -180 || body.lng > 180) {
      res.status(400).json({ error: 'Некорректные координаты' });
      return;
    }

    // Обновляем или создаём запись о местоположении
    await db.query(
      `INSERT INTO user_locations (user_id, lat, lng, accuracy, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         lat = EXCLUDED.lat,
         lng = EXCLUDED.lng,
         accuracy = EXCLUDED.accuracy,
         updated_at = NOW()`,
      [
        payload.userId,
        body.lat,
        body.lng,
        body.accuracy || null,
      ]
    );

    res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error('Update user location error', error, { userId: (req as any).userId });
    res.status(500).json({ error: 'Ошибка при обновлении местоположения' });
  }
}

