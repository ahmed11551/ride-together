/**
 * API endpoint для обновления статуса бронирования
 * PUT /api/bookings/:id
 */

import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { Request, Response } from 'express';


export async function updateBooking(req: Request, res: Response, bookingId: string): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const body = req.body as { status?: string; payment_status?: string };
    const { status, payment_status } = body;

    if (!status) {
      res.status(400).json({ error: 'status обязателен' });
      return;
    }

    // Получаем текущее бронирование
    const bookingResult = await db.query(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      res.status(404).json({ error: 'Бронирование не найдено' });
      return;
    }

    const booking = bookingResult.rows[0];

    // Проверяем права доступа
    // Водитель может подтверждать/отклонять бронирования на свои поездки
    // Пассажир может отменять свои бронирования
    const rideResult = await db.query(
      'SELECT driver_id FROM rides WHERE id = $1',
      [booking.ride_id]
    );

    const isDriver = rideResult.rows[0]?.driver_id === payload.userId;
    const isPassenger = booking.passenger_id === payload.userId;

    if (!isDriver && !isPassenger) {
      res.status(403).json({ error: 'Нет доступа к этому бронированию' });
      return;
    }

    // Валидация статуса
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Неверный статус' });
      return;
    }

    // Пассажир может только отменять
    if (isPassenger && !isDriver && status !== 'cancelled') {
      res.status(403).json({ error: 'Пассажир может только отменять бронирование' });
      return;
    }

    // Обновляем статус
    const updates: any = { status, updated_at: new Date() };
    if (payment_status) {
      updates.payment_status = payment_status;
    }

    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const result = await db.query(
      `UPDATE bookings SET ${setClause} WHERE id = $1 RETURNING *`,
      [bookingId, ...Object.values(updates)]
    );

    const updatedBooking = result.rows[0];

    res.status(200).json({
      id: updatedBooking.id,
      ride_id: updatedBooking.ride_id,
      passenger_id: updatedBooking.passenger_id,
      seats_booked: updatedBooking.seats_booked,
      status: updatedBooking.status,
      payment_status: updatedBooking.payment_status,
      total_price: parseFloat(updatedBooking.total_price),
      created_at: updatedBooking.created_at,
      updated_at: updatedBooking.updated_at,
    });
  } catch (error: any) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении бронирования' });
  }
}

