/**
 * API endpoint для удаления поездки
 * DELETE /api/rides/:id
 */

import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { Request, Response } from 'express';


export async function deleteRide(req: Request, res: Response, rideId: string): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    // Проверяем, что пользователь является водителем
    const rideCheck = await db.query(
      'SELECT driver_id, status FROM rides WHERE id = $1',
      [rideId]
    );

    if (rideCheck.rows.length === 0) {
      res.status(404).json({ error: 'Поездка не найдена' });
      return;
    }

    if (rideCheck.rows[0].driver_id !== payload.userId) {
      res.status(403).json({ error: 'Нет доступа к этой поездке' });
      return;
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

      res.status(200).json({ message: 'Поездка отменена (были активные бронирования)' });
      return;
    }

    // Если нет активных бронирований, удаляем
    await db.query('DELETE FROM rides WHERE id = $1', [rideId]);

    res.status(200).json({ message: 'Поездка удалена' });
  } catch (error: any) {
    console.error('Delete ride error:', error);
    res.status(500).json({ error: 'Ошибка при удалении поездки' });
  }
}

