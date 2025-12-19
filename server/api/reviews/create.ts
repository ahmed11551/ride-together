/**
 * API endpoint для создания отзыва
 * POST /api/reviews
 */

import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { Request, Response } from 'express';


export async function createReview(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const body = req.body as { ride_id?: string; to_user_id?: string; rating?: number; comment?: string };
    const { ride_id, to_user_id, rating, comment } = body;

    if (!ride_id || !to_user_id || !rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Не все обязательные поля заполнены или рейтинг неверный' });
      return;
    }

    // Проверяем, что поездка завершена
    const rideResult = await db.query(
      'SELECT status, driver_id FROM rides WHERE id = $1',
      [ride_id]
    );

    if (rideResult.rows.length === 0) {
      res.status(404).json({ error: 'Поездка не найдена' });
      return;
    }

    const ride = rideResult.rows[0];

    if (ride.status !== 'completed') {
      res.status(400).json({ error: 'Можно оставить отзыв только на завершенную поездку' });
      return;
    }

    // Проверяем, что пользователь участвовал в поездке
    const isDriver = ride.driver_id === payload.userId;
    const isPassenger = await db.query(
      'SELECT id FROM bookings WHERE ride_id = $1 AND passenger_id = $2 AND status = $3',
      [ride_id, payload.userId, 'completed']
    );

    if (!isDriver && isPassenger.rows.length === 0) {
      res.status(403).json({ error: 'Вы не участвовали в этой поездке' });
      return;
    }

    // Проверяем, что отзыв еще не оставлен
    const existingReview = await db.query(
      'SELECT id FROM reviews WHERE ride_id = $1 AND from_user_id = $2 AND to_user_id = $3',
      [ride_id, payload.userId, to_user_id]
    );

    if (existingReview.rows.length > 0) {
      res.status(409).json({ error: 'Отзыв уже оставлен' });
      return;
    }

    // Создаем отзыв
    const result = await db.query(
      `INSERT INTO reviews (ride_id, from_user_id, to_user_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [ride_id, payload.userId, to_user_id, rating, comment || null]
    );

    const review = result.rows[0];

    // Обновляем рейтинг пользователя (используем функцию БД)
    try {
      await db.query('SELECT update_user_ratings($1)', [to_user_id]);
    } catch (error) {
      console.error('Error updating user ratings:', error);
      // Продолжаем, даже если обновление рейтинга не удалось
    }

      res.status(201).json({ id: review.id, ride_id: review.ride_id, from_user_id: review.from_user_id, to_user_id: review.to_user_id, rating: review.rating, comment: review.comment, created_at: review.created_at, });
      return;
  } catch (error: any) {
    console.error('Create review error:', error);
      res.status(500).json({ error: 'Ошибка при создании отзыва' });
      return;
  }
}

