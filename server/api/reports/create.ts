/**
 * API endpoint для создания жалобы
 * POST /api/reports
 */

import { db } from '../../utils/database';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';

export async function createReport(req: Request): Promise<Response> {
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
    const { reported_user_id, ride_id, reason, description } = body;

    if (!reported_user_id || !reason) {
      return new Response(
        JSON.stringify({ error: 'reported_user_id и reason обязательны' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Создаем жалобу
    const result = await db.query(
      `INSERT INTO reports (reporter_id, reported_user_id, ride_id, reason, description, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [payload.userId, reported_user_id, ride_id || null, reason, description || null, 'pending']
    );

    const report = result.rows[0];

    return new Response(
      JSON.stringify({
        id: report.id,
        reporter_id: report.reporter_id,
        reported_user_id: report.reported_user_id,
        ride_id: report.ride_id,
        reason: report.reason,
        description: report.description,
        status: report.status,
        admin_notes: report.admin_notes,
        created_at: report.created_at,
        updated_at: report.updated_at,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Create report error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при создании жалобы' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

