/**
 * API endpoint для получения отзывов
 * GET /api/reviews
 */

import { db } from '../../utils/database';

export async function listReviews(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');
    const rideId = url.searchParams.get('ride_id');

    if (!userId && !rideId) {
      return new Response(
        JSON.stringify({ error: 'Необходимо указать user_id или ride_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let query = `
      SELECT 
        r.*,
        from_user.full_name as from_user_full_name,
        from_user.avatar_url as from_user_avatar_url,
        to_user.full_name as to_user_full_name,
        to_user.avatar_url as to_user_avatar_url
      FROM reviews r
      LEFT JOIN profiles from_user ON r.from_user_id = from_user.user_id
      LEFT JOIN profiles to_user ON r.to_user_id = to_user.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (userId) {
      params.push(userId);
      query += ` AND r.to_user_id = $${params.length}`;
    }

    if (rideId) {
      params.push(rideId);
      query += ` AND r.ride_id = $${params.length}`;
    }

    query += ' ORDER BY r.created_at DESC';

    const result = await db.query(query, params);

    const reviews = result.rows.map(row => ({
      id: row.id,
      ride_id: row.ride_id,
      from_user_id: row.from_user_id,
      to_user_id: row.to_user_id,
      rating: row.rating,
      comment: row.comment,
      created_at: row.created_at,
      from_user: row.from_user_full_name ? {
        full_name: row.from_user_full_name,
        avatar_url: row.from_user_avatar_url,
      } : undefined,
      to_user: row.to_user_full_name ? {
        full_name: row.to_user_full_name,
        avatar_url: row.to_user_avatar_url,
      } : undefined,
    }));

    return new Response(
      JSON.stringify(reviews),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('List reviews error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при получении отзывов' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
