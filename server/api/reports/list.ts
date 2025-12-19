/**
 * API endpoint для получения списка жалоб
 * GET /api/reports
 */

import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { Request, Response } from 'express';


export async function listReports(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const myOnly = req.query.my === 'true';

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
      res.status(403).json({ error: 'Доступ запрещен' });
      return;
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

      res.status(200).json(reports);
      return;
  } catch (error: any) {
    console.error('List reports error:', error);
      res.status(500).json({ error: 'Ошибка при получении жалоб' });
      return;
  }
}

