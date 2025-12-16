/**
 * API endpoint для удаления поездки
 * DELETE /api/rides/:id
 */

import { db } from '../../utils/database';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';

export async function deleteRide(req: Request, rideId: string): Promise<Response> {
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

    // Проверяем, что пользователь является водителем
    const rideCheck = await db.query(
      'SELECT driver_id, status FROM rides WHERE id = $1',
      [rideId]
    );

    if (rideCheck.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Поездка не найдена' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (rideCheck.rows[0].driver_id !== payload.userId) {
      return new Response(
        JSON.stringify({ error: 'Нет доступа к этой поездке' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Проверяем, есть ли активные бронирования
    const bookingsCheck = await db.query(
      'SELECT COUNT(*) as count FROM bookings WHERE ride_id = $1 AND status IN ($2, $3)',
      [rideId, 'pending', 'confirmed']
    );

    if (parseInt(bookingsCheck.rows[0].count) > 0) {
      // Вместо удаления, отменяем поездку
      await db.query(
        'UPDATE rides SET status = $1, updated_at = NOW() WHERE id = $2',
        ['cancelled', rideId]
      );

      // Отменяем все бронирования
      await db.query(
        'UPDATE bookings SET status = $1, updated_at = NOW() WHERE ride_id = $2 AND status IN ($3, $4)',
        ['cancelled', rideId, 'pending', 'confirmed']
      );

      return new Response(
        JSON.stringify({ message: 'Поездка отменена (были активные бронирования)' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Если нет активных бронирований, удаляем
    await db.query('DELETE FROM rides WHERE id = $1', [rideId]);

    return new Response(
      JSON.stringify({ message: 'Поездка удалена' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Delete ride error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при удалении поездки' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

