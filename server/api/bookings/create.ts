/**
 * API endpoint для создания бронирования
 * POST /api/bookings
 */

import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { Request, Response } from 'express';


export async function createBooking(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const body = req.body as { ride_id?: string; seats_booked?: number };
    const { ride_id, seats_booked } = body;

    if (!ride_id || !seats_booked || seats_booked < 1) {
      res.status(400).json({ error: 'ride_id и seats_booked обязательны' });
      return;
    }

    // Проверяем, что поездка существует и активна
    const rideResult = await db.query(
      'SELECT * FROM rides WHERE id = $1',
      [ride_id]
    );

    if (rideResult.rows.length === 0) {
      res.status(404).json({ error: 'Поездка не найдена' });
      return;
    }

    const ride = rideResult.rows[0];

    if (ride.status !== 'active') {
      res.status(400).json({ error: 'Поездка не активна' });
      return;
    }

    if (ride.driver_id === payload.userId) {
      res.status(400).json({ error: 'Нельзя забронировать свою поездку' });
      return;
    }

    if (ride.seats_available < seats_booked) {
      res.status(400).json({ error: 'Недостаточно свободных мест' });
      return;
    }

    // Проверяем, нет ли уже активного бронирования
    const existingBooking = await db.query(
      'SELECT id FROM bookings WHERE ride_id = $1 AND passenger_id = $2 AND status IN ($3, $4)',
      [ride_id, payload.userId, 'pending', 'confirmed']
    );

    if (existingBooking.rows.length > 0) {
      res.status(409).json({ error: 'У вас уже есть активное бронирование на эту поездку' });
      return;
    }

    const total_price = parseFloat(ride.price) * seats_booked;

    // Создаем бронирование (триггер обновит seats_available)
    const result = await db.query(
      `INSERT INTO bookings (ride_id, passenger_id, seats_booked, total_price, status, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [ride_id, payload.userId, seats_booked, total_price, 'pending', 'pending']
    );

    const booking = result.rows[0];

      res.status(201).json({ id: booking.id, ride_id: booking.ride_id, passenger_id: booking.passenger_id, seats_booked: booking.seats_booked, status: booking.status, payment_status: booking.payment_status, total_price: parseFloat(booking.total_price) });
      return;
  } catch (error: any) {
    console.error('Create booking error:', error);
      res.status(500).json({ error: 'Ошибка при создании бронирования' });
      return;
  }
}

