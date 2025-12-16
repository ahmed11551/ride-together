/**
 * API endpoint для создания отзыва
 * POST /api/reviews
 */

import { db } from '../../utils/database';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';

export async function createReview(req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      return new Response(
        JSON.stringify({ error: 'Не авторизован' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { ride_id, to_user_id, rating, comment } = body;

    if (!ride_id || !to_user_id || !rating || rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({ error: 'Не все обязательные поля заполнены или рейтинг неверный' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Проверяем, что поездка завершена
    const rideResult = await db.query(
      'SELECT status, driver_id FROM rides WHERE id = $1',
      [ride_id]
    );

    if (rideResult.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Поездка не найдена' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ride = rideResult.rows[0];

    if (ride.status !== 'completed') {
      return new Response(
        JSON.stringify({ error: 'Можно оставить отзыв только на завершенную поездку' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Проверяем, что пользователь участвовал в поездке
    const isDriver = ride.driver_id === payload.userId;
    const isPassenger = await db.query(
      'SELECT id FROM bookings WHERE ride_id = $1 AND passenger_id = $2 AND status = $3',
      [ride_id, payload.userId, 'completed']
    );

    if (!isDriver && isPassenger.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Вы не участвовали в этой поездке' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Проверяем, что отзыв еще не оставлен
    const existingReview = await db.query(
      'SELECT id FROM reviews WHERE ride_id = $1 AND from_user_id = $2 AND to_user_id = $3',
      [ride_id, payload.userId, to_user_id]
    );

    if (existingReview.rows.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Отзыв уже оставлен' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
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

    return new Response(
      JSON.stringify({
        id: review.id,
        ride_id: review.ride_id,
        from_user_id: review.from_user_id,
        to_user_id: review.to_user_id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Create review error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при создании отзыва' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

