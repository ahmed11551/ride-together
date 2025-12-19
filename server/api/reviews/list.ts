/**
 * API endpoint для получения отзывов
 * GET /api/reviews
 */

import { db } from '../../utils/database.js';
import { Request, Response } from 'express';


export async function listReviews(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.query.user_id as string | undefined;
    const rideId = req.query.ride_id as string | undefined;

    if (!userId && !rideId) {
      res.status(400).json({ error: 'Необходимо указать user_id или ride_id' });
      return;
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

      res.status(200).json(reviews);
      return;
  } catch (error: any) {
    console.error('List reviews error:', error);
      res.status(500).json({ error: 'Ошибка при получении отзывов' });
      return;
  }
}

