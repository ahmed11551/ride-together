/**
 * API endpoint для получения списка поездок
 * GET /api/rides
 */

import { db } from '../../utils/database';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';

export async function listRides(req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    const userId = token ? verifyToken(token)?.userId : null;

    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const date = url.searchParams.get('date');
    const passengers = parseInt(url.searchParams.get('passengers') || '1');
    const status = url.searchParams.get('status') || 'active';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Базовый запрос
    let query = `
      SELECT 
        r.*,
        p.full_name as driver_full_name,
        p.avatar_url as driver_avatar_url,
        p.rating as driver_rating,
        p.trips_count as driver_trips_count,
        p.is_verified as driver_is_verified
      FROM rides r
      LEFT JOIN profiles p ON r.driver_id = p.user_id
      WHERE r.status = $1
        AND r.seats_available >= $2
    `;
    const params: any[] = [status, passengers];

    // Фильтры
    if (from) {
      params.push(`%${from}%`);
      query += ` AND r.from_city ILIKE $${params.length}`;
    }
    if (to) {
      params.push(`%${to}%`);
      query += ` AND r.to_city ILIKE $${params.length}`;
    }
    if (date) {
      params.push(date);
      query += ` AND r.departure_date = $${params.length}`;
    }

    // Сортировка
    query += ` ORDER BY r.departure_date ASC, r.departure_time ASC`;

    // Лимит и оффсет
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await db.query(query, params);

    const rides = result.rows.map(row => ({
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
      } : undefined,
    }));

    return new Response(
      JSON.stringify(rides),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('List rides error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при получении списка поездок' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
