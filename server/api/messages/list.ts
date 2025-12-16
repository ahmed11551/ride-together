/**
 * API endpoint для получения сообщений поездки
 * GET /api/messages/:rideId
 */

import { db } from '../../utils/database';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';

export async function listMessages(req: Request, rideId: string): Promise<Response> {
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

    // Проверяем доступ к чату
    const rideResult = await db.query(
      'SELECT driver_id FROM rides WHERE id = $1',
      [rideId]
    );

    if (rideResult.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Поездка не найдена' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const isDriver = rideResult.rows[0].driver_id === payload.userId;
    const isParticipant = await db.query(
      'SELECT id FROM bookings WHERE ride_id = $1 AND passenger_id = $2 AND status IN ($3, $4)',
      [rideId, payload.userId, 'pending', 'confirmed']
    );

    if (!isDriver && isParticipant.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Нет доступа к чату этой поездки' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
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

    return new Response(
      JSON.stringify(messages),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('List messages error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при получении сообщений' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

