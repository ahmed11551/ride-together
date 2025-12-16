/**
 * API endpoint для создания поездки
 * POST /api/rides
 */

import { db } from '../../utils/database';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';

export async function createRide(req: Request): Promise<Response> {
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
    const {
      from_city,
      from_address,
      to_city,
      to_address,
      departure_date,
      departure_time,
      estimated_duration,
      price,
      seats_total,
      allow_smoking = false,
      allow_pets = false,
      allow_music = false,
      notes,
    } = body;

    // Валидация
    if (!from_city || !to_city || !departure_date || !departure_time || !price || !seats_total) {
      return new Response(
        JSON.stringify({ error: 'Не все обязательные поля заполнены' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Создание поездки
    const result = await db.query(
      `INSERT INTO rides (
        driver_id, from_city, from_address, to_city, to_address,
        departure_date, departure_time, estimated_duration, price,
        seats_total, seats_available, status, allow_smoking, allow_pets,
        allow_music, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        payload.userId,
        from_city,
        from_address || null,
        to_city,
        to_address || null,
        departure_date,
        departure_time,
        estimated_duration || null,
        price,
        seats_total,
        seats_total, // seats_available = seats_total при создании
        'active',
        allow_smoking,
        allow_pets,
        allow_music,
        notes || null,
      ]
    );

    const ride = result.rows[0];

    return new Response(
      JSON.stringify({
        id: ride.id,
        driver_id: ride.driver_id,
        from_city: ride.from_city,
        from_address: ride.from_address,
        to_city: ride.to_city,
        to_address: ride.to_address,
        departure_date: ride.departure_date,
        departure_time: ride.departure_time,
        estimated_duration: ride.estimated_duration,
        price: parseFloat(ride.price),
        seats_total: ride.seats_total,
        seats_available: ride.seats_available,
        status: ride.status,
        allow_smoking: ride.allow_smoking,
        allow_pets: ride.allow_pets,
        allow_music: ride.allow_music,
        notes: ride.notes,
        created_at: ride.created_at,
        updated_at: ride.updated_at,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Create ride error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при создании поездки' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
