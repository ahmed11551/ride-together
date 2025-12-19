/**
 * API endpoint для создания жалобы
 * POST /api/reports
 */

import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { Request, Response } from 'express';


export async function createReport(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const body = req.body as { reported_user_id?: string; ride_id?: string; reason?: string; description?: string };
    const { reported_user_id, ride_id, reason, description } = body;

    if (!reported_user_id || !reason) {
      res.status(400).json({ error: 'reported_user_id и reason обязательны' });
      return;
    }

    // Создаем жалобу
    const result = await db.query(
      `INSERT INTO reports (reporter_id, reported_user_id, ride_id, reason, description, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [payload.userId, reported_user_id, ride_id || null, reason, description || null, 'pending']
    );

    const report = result.rows[0];

      res.status(201).json({ id: report.id, reporter_id: report.reporter_id, reported_user_id: report.reported_user_id, ride_id: report.ride_id, reason: report.reason, description: report.description, status: report.status, admin_notes: report.admin_notes, created_at: report.created_at, updated_at: report.updated_at, });
      return;
  } catch (error: any) {
    console.error('Create report error:', error);
      res.status(500).json({ error: 'Ошибка при создании жалобы' });
      return;
  }
}

