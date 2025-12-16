/**
 * API endpoint для получения поездки по ID
 * GET /api/rides/:id
 */

import { db } from '../../utils/database';

export async function getRide(req: Request, rideId: string): Promise<Response> {
  try {
    const result = await db.query(
      `SELECT 
        r.*,
        p.full_name as driver_full_name,
        p.avatar_url as driver_avatar_url,
        p.rating as driver_rating,
        p.trips_count as driver_trips_count,
        p.is_verified as driver_is_verified,
        p.phone as driver_phone
      FROM rides r
      LEFT JOIN profiles p ON r.driver_id = p.user_id
      WHERE r.id = $1`,
      [rideId]
    );

    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Поездка не найдена' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const row = result.rows[0];
    const ride = {
      id: row.id,
      driver_id: row.driver_id,
      from_city: row.from_city,
      from_address: row.from_address,
      to_city: row.to_city,
      to_address: row.to_address,
      departure_date: row.departure_date,
      departure_time: row.departure_time,
      estimated_duration: row.estimated_duration,
      price: parseFloat(row.price),
      seats_total: row.seats_total,
      seats_available: row.seats_available,
      status: row.status,
      allow_smoking: row.allow_smoking,
      allow_pets: row.allow_pets,
      allow_music: row.allow_music,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      driver: row.driver_full_name ? {
        full_name: row.driver_full_name,
        avatar_url: row.driver_avatar_url,
        rating: parseFloat(row.driver_rating || '5.0'),
        trips_count: row.driver_trips_count || 0,
        is_verified: row.driver_is_verified || false,
        phone: row.driver_phone,
      } : undefined,
    };

    return new Response(
      JSON.stringify(ride),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Get ride error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при получении поездки' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

