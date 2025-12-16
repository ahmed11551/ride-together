/**
 * API endpoint для обновления жалобы (только для админов)
 * PUT /api/reports/:id
 */

import { db } from '../../utils/database';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';

export async function updateReport(req: Request, reportId: string): Promise<Response> {
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

    const body = await req.json();
    const { status, admin_notes } = body;

    if (!status) {
      return new Response(
        JSON.stringify({ error: 'status обязателен' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updates: any = { status, updated_at: new Date() };
    if (admin_notes !== undefined) {
      updates.admin_notes = admin_notes;
    }

    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const result = await db.query(
      `UPDATE reports SET ${setClause} WHERE id = $1 RETURNING *`,
      [reportId, ...Object.values(updates)]
    );

    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Жалоба не найдена' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

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
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Update report error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при обновлении жалобы' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

