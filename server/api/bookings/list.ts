/**
 * API endpoint для получения списка бронирований
 * GET /api/bookings
 */

import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { Request, Response } from 'express';


export async function listBookings(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const rideId = req.query.ride_id as string | undefined;
    const status = req.query.status as string | undefined;

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

      res.status(200).json(bookings);
      return;
  } catch (error: any) {
    console.error('List bookings error:', error);
      res.status(500).json({ error: 'Ошибка при получении бронирований' });
      return;
  }
}

