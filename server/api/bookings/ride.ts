/**
 * API endpoint для получения бронирований поездки
 * GET /api/bookings/ride/:rideId
 */

import { db } from '../../utils/database';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';

export async function getRideBookings(req: Request, rideId: string): Promise<Response> {
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

    // Проверяем, что пользователь является водителем или участником
    const rideResult = await db.query(
      'SELECT driver_id FROM rides WHERE id = $1',
      [rideId]
    );

    if (rideResult.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Поездка не найдена' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const isDriver = rideResult.rows[0].driver_id === payload.userId;
    const isParticipant = await db.query(
      'SELECT id FROM bookings WHERE ride_id = $1 AND passenger_id = $2',
      [rideId, payload.userId]
    );

    if (!isDriver && isParticipant.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Нет доступа к бронированиям этой поездки' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await db.query(
      `SELECT 
        b.*,
        p.full_name as passenger_full_name,
        p.avatar_url as passenger_avatar_url,
        p.phone as passenger_phone
      FROM bookings b
      LEFT JOIN profiles p ON b.passenger_id = p.user_id
      WHERE b.ride_id = $1
      ORDER BY b.created_at DESC`,
      [rideId]
    );

    const bookings = result.rows.map(row => ({
      id: row.id,
      ride_id: row.ride_id,
      passenger_id: row.passenger_id,
      seats_booked: row.seats_booked,
      status: row.status,
      payment_status: row.payment_status,
      total_price: parseFloat(row.total_price),
      created_at: row.created_at,
      updated_at: row.updated_at,
      passenger: row.passenger_full_name ? {
        full_name: row.passenger_full_name,
        avatar_url: row.passenger_avatar_url,
        phone: row.passenger_phone,
      } : undefined,
    }));

    return new Response(
      JSON.stringify(bookings),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Get ride bookings error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при получении бронирований' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

