/**
 * API endpoint для получения списка жалоб
 * GET /api/reports
 */

import { db } from '../../utils/database';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';

export async function listReports(req: Request): Promise<Response> {
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
    const myOnly = url.searchParams.get('my') === 'true';

    let query = `
      SELECT 
        r.*,
        reported_user.full_name as reported_user_full_name,
        reported_user.email as reported_user_email,
        reporter.full_name as reporter_full_name,
        ride.from_city, ride.to_city
      FROM reports r
      LEFT JOIN profiles reported_user ON r.reported_user_id = reported_user.user_id
      LEFT JOIN profiles reporter ON r.reporter_id = reporter.user_id
      LEFT JOIN rides ride ON r.ride_id = ride.id
    `;
    const params: any[] = [];

    if (myOnly) {
      params.push(payload.userId);
      query += ` WHERE r.reporter_id = $1`;
    } else {
      // Проверяем, является ли пользователь админом
      const adminCheck = await db.query(
        'SELECT is_admin FROM profiles WHERE user_id = $1',
        [payload.userId]
      );

      if (!adminCheck.rows[0]?.is_admin) {
        return new Response(
          JSON.stringify({ error: 'Доступ запрещен' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    query += ' ORDER BY r.created_at DESC';

    const result = await db.query(query, params);

    const reports = result.rows.map(row => ({
      id: row.id,
      reporter_id: row.reporter_id,
      reported_user_id: row.reported_user_id,
      ride_id: row.ride_id,
      reason: row.reason,
      description: row.description,
      status: row.status,
      admin_notes: row.admin_notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      reported_user: row.reported_user_full_name ? {
        full_name: row.reported_user_full_name,
        email: row.reported_user_email,
      } : undefined,
      reporter: row.reporter_full_name ? {
        full_name: row.reporter_full_name,
      } : undefined,
      ride: row.ride_id ? {
        from_city: row.from_city,
        to_city: row.to_city,
      } : undefined,
    }));

    return new Response(
      JSON.stringify(reports),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('List reports error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при получении жалоб' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

