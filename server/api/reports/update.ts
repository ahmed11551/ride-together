/**
 * API endpoint для обновления жалобы (только для админов)
 * PUT /api/reports/:id
 */

import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { Request, Response } from 'express';


export async function updateReport(req: Request, res: Response, reportId: string): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    // Проверяем, является ли пользователь админом
    const adminCheck = await db.query(
      'SELECT is_admin FROM profiles WHERE user_id = $1',
      [payload.userId]
    );

    if (!adminCheck.rows[0]?.is_admin) {
      res.status(403).json({ error: 'Доступ запрещен' });
      return;
    }

    const body = req.body as { status?: string; admin_notes?: string };
    const { status, admin_notes } = body;

    if (!status) {
      res.status(400).json({ error: 'status обязателен' });
      return;
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
      res.status(404).json({ error: 'Жалоба не найдена' });
      return;
    }

    const report = result.rows[0];

    res.status(200).json({
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
    });
  } catch (error: any) {
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении жалобы' });
  }
}

