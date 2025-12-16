/**
 * API endpoint для создания бронирования
 * POST /api/bookings
 */

import { db } from '../../utils/database';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';

export async function createBooking(req: Request): Promise<Response> {
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
    const { ride_id, seats_booked } = body;

    if (!ride_id || !seats_booked || seats_booked < 1) {
      return new Response(
        JSON.stringify({ error: 'ride_id и seats_booked обязательны' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Проверяем, что поездка существует и активна
    const rideResult = await db.query(
      'SELECT * FROM rides WHERE id = $1',
      [ride_id]
    );

    if (rideResult.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Поездка не найдена' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ride = rideResult.rows[0];

    if (ride.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Поездка не активна' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (ride.driver_id === payload.userId) {
      return new Response(
        JSON.stringify({ error: 'Нельзя забронировать свою поездку' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (ride.seats_available < seats_booked) {
      return new Response(
        JSON.stringify({ error: 'Недостаточно свободных мест' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Проверяем, нет ли уже активного бронирования
    const existingBooking = await db.query(
      'SELECT id FROM bookings WHERE ride_id = $1 AND passenger_id = $2 AND status IN ($3, $4)',
      [ride_id, payload.userId, 'pending', 'confirmed']
    );

    if (existingBooking.rows.length > 0) {
      return new Response(
        JSON.stringify({ error: 'У вас уже есть активное бронирование на эту поездку' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
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

    return new Response(
      JSON.stringify({
        id: booking.id,
        ride_id: booking.ride_id,
        passenger_id: booking.passenger_id,
        seats_booked: booking.seats_booked,
        status: booking.status,
        payment_status: booking.payment_status,
        total_price: parseFloat(booking.total_price),
        created_at: booking.created_at,
        updated_at: booking.updated_at,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Create booking error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при создании бронирования' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
