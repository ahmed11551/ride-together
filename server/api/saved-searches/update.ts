/**
 * API endpoint для обновления сохранённого поиска
 * PUT /api/saved-searches/:id
 */

import { Request, Response } from 'express';
import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { logger } from '../../utils/logger.js';

export async function updateSavedSearch(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const searchId = req.params.id;
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
    };

    // Проверяем, что поиск принадлежит пользователю
    const checkResult = await db.query(
      'SELECT id FROM saved_searches WHERE id = $1 AND user_id = $2',
      [searchId, payload.userId]
    );

    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'Поиск не найден' });
      return;
    }

    // Обновляем поиск
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(body.name);
    }
    if (body.fromCity !== undefined) {
      updates.push(`from_city = $${paramIndex++}`);
      params.push(body.fromCity);
    }
    if (body.toCity !== undefined) {
      updates.push(`to_city = $${paramIndex++}`);
      params.push(body.toCity);
    }
    if (body.date !== undefined) {
      updates.push(`date = $${paramIndex++}`);
      params.push(body.date);
    }
    if (body.dateFrom !== undefined) {
      updates.push(`date_from = $${paramIndex++}`);
      params.push(body.dateFrom);
    }
    if (body.dateTo !== undefined) {
      updates.push(`date_to = $${paramIndex++}`);
      params.push(body.dateTo);
    }
    if (body.timeFrom !== undefined) {
      updates.push(`time_from = $${paramIndex++}`);
      params.push(body.timeFrom);
    }
    if (body.timeTo !== undefined) {
      updates.push(`time_to = $${paramIndex++}`);
      params.push(body.timeTo);
    }
    if (body.passengers !== undefined) {
      updates.push(`passengers = $${paramIndex++}`);
      params.push(body.passengers);
    }
    if (body.minPrice !== undefined) {
      updates.push(`min_price = $${paramIndex++}`);
      params.push(body.minPrice);
    }
    if (body.maxPrice !== undefined) {
      updates.push(`max_price = $${paramIndex++}`);
      params.push(body.maxPrice);
    }
    if (body.allowSmoking !== undefined) {
      updates.push(`allow_smoking = $${paramIndex++}`);
      params.push(body.allowSmoking);
    }
    if (body.allowPets !== undefined) {
      updates.push(`allow_pets = $${paramIndex++}`);
      params.push(body.allowPets);
    }
    if (body.allowMusic !== undefined) {
      updates.push(`allow_music = $${paramIndex++}`);
      params.push(body.allowMusic);
    }
    if (body.minRating !== undefined) {
      updates.push(`min_rating = $${paramIndex++}`);
      params.push(body.minRating);
    }
    if (body.sortBy !== undefined) {
      updates.push(`sort_by = $${paramIndex++}`);
      params.push(body.sortBy);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'Нет полей для обновления' });
      return;
    }

    updates.push(`updated_at = NOW()`);
    params.push(searchId, payload.userId);

    await db.query(
      `UPDATE saved_searches 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
      params
    );

    res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error('Update saved search error', error, { userId: (req as any).userId });
    res.status(500).json({ error: 'Ошибка при обновлении поиска' });
  }
}

