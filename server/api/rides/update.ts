/**
 * API endpoint для обновления поездки
 * PUT /api/rides/:id
 */

import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { Request, Response } from 'express';
import { logger } from '../../utils/logger.js';


export async function updateRide(req: Request, res: Response, rideId: string): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    // Проверяем, что пользователь является водителем
    const rideCheck = await db.query(
      'SELECT driver_id FROM rides WHERE id = $1',
      [rideId]
    );

    if (rideCheck.rows.length === 0) {
      res.status(404).json({ error: 'Поездка не найдена' });
      return;
    }

    if (rideCheck.rows[0].driver_id !== payload.userId) {
      res.status(403).json({ error: 'Нет доступа к этой поездке' });
      return;
    }

    const body = req.body as Record<string, any>;
    const updates: any = {};

    // Разрешенные поля для обновления
    const allowedFields = [
      'from_city', 'from_address', 'to_city', 'to_address',
      'departure_date', 'departure_time', 'estimated_duration',
      'price', 'seats_total', 'allow_smoking', 'allow_pets',
      'allow_music', 'notes', 'status'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'Нет полей для обновления' });
      return;
    }

    // Если обновляется seats_total, нужно пересчитать seats_available
    if (updates.seats_total !== undefined) {
      const currentRide = await db.query(
        'SELECT seats_total, seats_available FROM rides WHERE id = $1',
        [rideId]
      );
      const current = currentRide.rows[0];
      const booked = current.seats_total - current.seats_available;
      updates.seats_available = Math.max(0, updates.seats_total - booked);
    }

    // Формируем SQL запрос
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const result = await db.query(
      `UPDATE rides SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [rideId, ...Object.values(updates)]
    );

    const ride = result.rows[0];

    res.status(200).json({
      id: ride.id,
      driver_id: ride.driver_id,
      from_city: ride.from_city,
      from_address: ride.from_address,
      to_city: ride.to_city,
      to_address: ride.to_address,
      departure_date: ride.departure_date,
      departure_time: ride.departure_time,
      estimated_duration: ride.estimated_duration,
      price: parseFloat(ride.price),
      seats_total: ride.seats_total,
      seats_available: ride.seats_available,
      status: ride.status,
      allow_smoking: ride.allow_smoking,
      allow_pets: ride.allow_pets,
      allow_music: ride.allow_music,
      notes: ride.notes,
      created_at: ride.created_at,
      updated_at: ride.updated_at,
    });
  } catch (error: unknown) {
    logger.error('Update ride error', error instanceof Error ? error : new Error(String(error)), {
      path: req.path,
      rideId: req.params.id,
      body: req.body,
    });
    res.status(500).json({ error: 'Ошибка при обновлении поездки' });
  }
}

