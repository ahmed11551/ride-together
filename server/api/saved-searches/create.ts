/**
 * API endpoint для сохранения поискового запроса
 * POST /api/saved-searches
 */

import { Request, Response } from 'express';
import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { logger } from '../../utils/logger.js';

export async function createSavedSearch(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const body = req.body as {
      name?: string;
      fromCity?: string;
      toCity?: string;
      date?: string;
      dateFrom?: string;
      dateTo?: string;
      timeFrom?: string;
      timeTo?: string;
      passengers?: number;
      minPrice?: number;
      maxPrice?: number;
      allowSmoking?: boolean;
      allowPets?: boolean;
      allowMusic?: boolean;
      minRating?: number;
      sortBy?: string;
      notifyTelegram?: boolean;
    };

    // Проверяем, что есть хотя бы основные параметры поиска
    if (!body.fromCity && !body.toCity) {
      res.status(400).json({ error: 'Необходимо указать город отправления или назначения' });
      return;
    }

    const result = await db.query(
      `INSERT INTO saved_searches (
        user_id, name, from_city, to_city, date, date_from, date_to,
        time_from, time_to, passengers, min_price, max_price,
        allow_smoking, allow_pets, allow_music, min_rating, sort_by, notify_telegram
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id, name, from_city, to_city, notify_telegram, created_at`,
      [
        payload.userId,
        body.name || null,
        body.fromCity || null,
        body.toCity || null,
        body.date || null,
        body.dateFrom || null,
        body.dateTo || null,
        body.timeFrom || null,
        body.timeTo || null,
        body.passengers || 1,
        body.minPrice || null,
        body.maxPrice || null,
        body.allowSmoking ?? null,
        body.allowPets ?? null,
        body.allowMusic ?? null,
        body.minRating || null,
        body.sortBy || 'departure',
        body.notifyTelegram !== false,
      ]
    );

    // Включаем Telegram-уведомления для пользователей с привязанным Telegram
    if (body.notifyTelegram !== false) {
      await db.query(
        `UPDATE profiles SET telegram_notifications = true, updated_at = NOW()
         WHERE user_id = $1 AND telegram_id IS NOT NULL`,
        [payload.userId]
      );
    }

    const savedSearch = result.rows[0];
    res.status(201).json({
      id: savedSearch.id,
      name: savedSearch.name,
      fromCity: savedSearch.from_city,
      toCity: savedSearch.to_city,
      notifyTelegram: savedSearch.notify_telegram,
      createdAt: savedSearch.created_at,
    });
  } catch (error: any) {
    logger.error('Create saved search error', error, { userId: (req as any).userId });
    res.status(500).json({ error: 'Ошибка при сохранении поиска' });
  }
}

