/**
 * API endpoint для получения бронирований поездки
 * GET /api/bookings/ride/:rideId
 */

import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { Request, Response } from 'express';


export async function getRideBookings(req: Request, res: Response, rideId: string): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    // Проверяем, что пользователь является водителем или участником
    const rideResult = await db.query(
      'SELECT driver_id FROM rides WHERE id = $1',
      [rideId]
    );

    if (rideResult.rows.length === 0) {
      res.status(404).json({ error: 'Поездка не найдена' });
      return;
    }

    const isDriver = rideResult.rows[0].driver_id === payload.userId;
    const isParticipant = await db.query(
      'SELECT id FROM bookings WHERE ride_id = $1 AND passenger_id = $2',
      [rideId, payload.userId]
    );

    if (!isDriver && isParticipant.rows.length === 0) {
      res.status(403).json({ error: 'Нет доступа к бронированиям этой поездки' });
      return;
    }

    const result = await db.query(
      `SELECT 
        b.*,
        p.full_name as passenger_full_name,
        p.avatar_url as passenger_avatar_url,
        p.phone as passenger_phone,
        p.rating as passenger_driver_rating,
        p.passenger_rating as passenger_rating_value
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
        rating: row.passenger_driver_rating ? parseFloat(row.passenger_driver_rating) : 0,
        passenger_rating: row.passenger_rating_value ? parseFloat(row.passenger_rating_value) : 0,
      } : undefined,
    }));

    res.status(200).json(bookings);
  } catch (error: any) {
    console.error('Get ride bookings error:', error);
    res.status(500).json({ error: 'Ошибка при получении бронирований' });
  }
}

