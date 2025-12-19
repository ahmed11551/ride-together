/**
 * API endpoint для получения сообщений поездки
 * GET /api/messages/:rideId
 */

import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { Request, Response } from 'express';


export async function listMessages(req: Request, res: Response, rideId: string): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    // Проверяем доступ к чату
    const rideResult = await db.query(
      'SELECT driver_id FROM rides WHERE id = $1',
      [rideId]
    );

    if (rideResult.rows.length === 0) {
      res.status(404).json({ error: 'Поездка не найдена' });
      return;
    }

    const isDriver = rideResult.rows[0].driver_id === payload.userId;
    const isParticipant = await db.query(
      'SELECT id FROM bookings WHERE ride_id = $1 AND passenger_id = $2 AND status IN ($3, $4)',
      [rideId, payload.userId, 'pending', 'confirmed']
    );

    if (!isDriver && isParticipant.rows.length === 0) {
      res.status(403).json({ error: 'Нет доступа к чату этой поездки' });
      return;
    }

    // Получаем сообщения
    const result = await db.query(
      `SELECT 
        m.*,
        p.full_name as sender_full_name,
        p.avatar_url as sender_avatar_url
      FROM messages m
      LEFT JOIN profiles p ON m.sender_id = p.user_id
      WHERE m.ride_id = $1
      ORDER BY m.created_at ASC`,
      [rideId]
    );

    const messages = result.rows.map(row => ({
      id: row.id,
      ride_id: row.ride_id,
      sender_id: row.sender_id,
      content: row.content,
      created_at: row.created_at,
      sender: row.sender_full_name ? {
        full_name: row.sender_full_name,
        avatar_url: row.sender_avatar_url,
      } : undefined,
    }));

    res.status(200).json(messages);
  } catch (error: any) {
    console.error('List messages error:', error);
    res.status(500).json({ error: 'Ошибка при получении сообщений' });
  }
}

