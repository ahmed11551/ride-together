/**
 * API endpoint для получения поездок пользователя
 * GET /api/rides/my
 */

import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { Request, Response } from 'express';
import { logger } from '../../utils/logger.js';


export async function getMyRides(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const status = req.query.status as string | undefined;
    const limit = parseInt((req.query.limit as string) || '50');
    const offset = parseInt((req.query.offset as string) || '0');

    let query = 'SELECT * FROM rides WHERE driver_id = $1';
    const params: any[] = [payload.userId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY departure_date ASC, departure_time ASC';
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
    }));

      res.status(200).json(rides);
      return;
  } catch (error: unknown) {
    logger.error('Get my rides error', error instanceof Error ? error : new Error(String(error)), {
      path: req.path,
      query: req.query,
    });
    res.status(500).json({ error: 'Ошибка при получении поездок' });
    return;
  }
}

