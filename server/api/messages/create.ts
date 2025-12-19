/**
 * API endpoint для отправки сообщения
 * POST /api/messages
 */

import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { Request, Response } from 'express';


export async function createMessage(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const body = req.body as { ride_id?: string; content?: string };
    const { ride_id, content } = body;

    if (!ride_id || !content || !content.trim()) {
      res.status(400).json({ error: 'ride_id и content обязательны' });
      return;
    }

    // Проверяем доступ к чату
    const rideResult = await db.query(
      'SELECT driver_id FROM rides WHERE id = $1',
      [ride_id]
    );

    if (rideResult.rows.length === 0) {
      res.status(404).json({ error: 'Поездка не найдена' });
      return;
    }

    const isDriver = rideResult.rows[0].driver_id === payload.userId;
    const isParticipantResult = await db.query(
      'SELECT id FROM bookings WHERE ride_id = $1 AND passenger_id = $2 AND status IN ($3, $4)',
      [ride_id, payload.userId, 'pending', 'confirmed']
    );
    const isParticipant = isParticipantResult.rows.length > 0;

    if (!isDriver && !isParticipant) {
      res.status(403).json({ error: 'Нет доступа к чату этой поездки' });
      return;
    }

    // Создаем сообщение
    const result = await db.query(
      `INSERT INTO messages (ride_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [ride_id, payload.userId, content.trim()]
    );

    const message = result.rows[0];

    // Получаем информацию об отправителе
    const profileResult = await db.query(
      'SELECT full_name, avatar_url FROM profiles WHERE user_id = $1',
      [payload.userId]
    );

    const profile = profileResult.rows[0];

    const messageWithSender = {
      id: message.id,
      ride_id: message.ride_id,
      sender_id: message.sender_id,
      content: message.content,
      created_at: message.created_at,
      sender: profile ? {
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
      } : undefined,
    };

    // Отправляем через WebSocket всем участникам
    // Используем broadcastMessage из websocket/server
    const { io } = await import('../../index.js').catch(() => ({ io: null }));
    if (io) {
      io.to(`ride-${ride_id}`).emit('new-message', messageWithSender);
    }

      res.status(201).json(messageWithSender);
      return;
  } catch (error: any) {
    console.error('Create message error:', error);
      res.status(500).json({ error: 'Ошибка при отправке сообщения' });
      return;
  }
}

