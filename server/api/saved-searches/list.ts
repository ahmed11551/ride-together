/**
 * API endpoint для получения сохранённых поисков
 * GET /api/saved-searches
 */

import { Request, Response } from 'express';
import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { logger } from '../../utils/logger.js';

export async function listSavedSearches(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const result = await db.query(
      `SELECT id, name, from_city, to_city, date, date_from, date_to, time_from, time_to,
              passengers, min_price, max_price, allow_smoking, allow_pets, allow_music,
              min_rating, sort_by, created_at, updated_at, last_searched_at
       FROM saved_searches
       WHERE user_id = $1
       ORDER BY last_searched_at DESC
       LIMIT 50`,
      [payload.userId]
    );

    res.status(200).json({
      searches: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        fromCity: row.from_city,
        toCity: row.to_city,
        date: row.date,
        dateFrom: row.date_from,
        dateTo: row.date_to,
        timeFrom: row.time_from,
        timeTo: row.time_to,
        passengers: row.passengers,
        minPrice: row.min_price ? parseFloat(row.min_price) : undefined,
        maxPrice: row.max_price ? parseFloat(row.max_price) : undefined,
        allowSmoking: row.allow_smoking,
        allowPets: row.allow_pets,
        allowMusic: row.allow_music,
        minRating: row.min_rating ? parseFloat(row.min_rating) : undefined,
        sortBy: row.sort_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastSearchedAt: row.last_searched_at,
      })),
    });
  } catch (error: any) {
    logger.error('List saved searches error', error, { userId: (req as any).userId });
    res.status(500).json({ error: 'Ошибка при получении сохранённых поисков' });
  }
}

