/**
 * API endpoint для обновления статуса бронирования
 * PUT /api/bookings/:id
 */

import { db } from '../../utils/database';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';

export async function updateBooking(req: Request, bookingId: string): Promise<Response> {
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
    const { status, payment_status } = body;

    if (!status) {
      return new Response(
        JSON.stringify({ error: 'status обязателен' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Получаем текущее бронирование
    const bookingResult = await db.query(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Бронирование не найдено' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ error: 'Нет доступа к этому бронированию' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Валидация статуса
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Неверный статус' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Пассажир может только отменять
    if (isPassenger && !isDriver && status !== 'cancelled') {
      return new Response(
        JSON.stringify({ error: 'Пассажир может только отменять бронирование' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
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

    return new Response(
      JSON.stringify({
        id: updatedBooking.id,
        ride_id: updatedBooking.ride_id,
        passenger_id: updatedBooking.passenger_id,
        seats_booked: updatedBooking.seats_booked,
        status: updatedBooking.status,
        payment_status: updatedBooking.payment_status,
        total_price: parseFloat(updatedBooking.total_price),
        created_at: updatedBooking.created_at,
        updated_at: updatedBooking.updated_at,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Update booking error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при обновлении бронирования' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
