/**
 * API endpoint для отправки сообщения
 * POST /api/messages
 */

import { db } from '../../utils/database';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';
import { broadcastMessage } from '../../websocket/server';

export async function createMessage(req: Request): Promise<Response> {
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
    const { ride_id, content } = body;

    if (!ride_id || !content || !content.trim()) {
      return new Response(
        JSON.stringify({ error: 'ride_id и content обязательны' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Проверяем доступ к чату
    const rideResult = await db.query(
      'SELECT driver_id FROM rides WHERE id = $1',
      [ride_id]
    );

    if (rideResult.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Поездка не найдена' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const isDriver = rideResult.rows[0].driver_id === payload.userId;
    const isParticipantResult = await db.query(
      'SELECT id FROM bookings WHERE ride_id = $1 AND passenger_id = $2 AND status IN ($3, $4)',
      [ride_id, payload.userId, 'pending', 'confirmed']
    );
    const isParticipant = isParticipantResult.rows.length > 0;

    if (!isDriver && isParticipant.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Нет доступа к чату этой поездки' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
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
    const { io } = await import('../../index').catch(() => ({ io: null }));
    if (io) {
      io.to(`ride-${ride_id}`).emit('new-message', messageWithSender);
    }

    return new Response(
      JSON.stringify(messageWithSender),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Create message error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при отправке сообщения' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
