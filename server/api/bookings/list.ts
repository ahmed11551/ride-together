/**
 * API endpoint для получения списка бронирований
 * GET /api/bookings
 */

import { db } from '../../utils/database';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';

export async function listBookings(req: Request): Promise<Response> {
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

    const url = new URL(req.url);
    const rideId = url.searchParams.get('ride_id');
    const status = url.searchParams.get('status');

    let query = `
      SELECT 
        b.*,
        r.from_city, r.to_city, r.departure_date, r.departure_time,
        r.price, r.seats_available, r.driver_id,
        p.full_name as driver_full_name,
        p.avatar_url as driver_avatar_url
      FROM bookings b
      LEFT JOIN rides r ON b.ride_id = r.id
      LEFT JOIN profiles p ON r.driver_id = p.user_id
      WHERE b.passenger_id = $1
    `;
    const params: any[] = [payload.userId];

    if (rideId) {
      params.push(rideId);
      query += ` AND b.ride_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND b.status = $${params.length}`;
    }

    query += ' ORDER BY b.created_at DESC';

    const result = await db.query(query, params);

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
      ride: row.ride_id ? {
        id: row.ride_id,
        from_city: row.from_city,
        to_city: row.to_city,
        departure_date: row.departure_date,
        departure_time: row.departure_time,
        price: parseFloat(row.price),
        seats_available: row.seats_available,
        driver_id: row.driver_id,
        driver: row.driver_full_name ? {
          full_name: row.driver_full_name,
          avatar_url: row.driver_avatar_url,
        } : undefined,
      } : undefined,
    }));

    return new Response(
      JSON.stringify(bookings),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('List bookings error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при получении бронирований' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

