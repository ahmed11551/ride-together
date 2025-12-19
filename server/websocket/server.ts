/**
 * WebSocket сервер для Realtime функций
 * Замена Supabase Realtime
 */

import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import { db } from '../utils/database.js';

export function createWebSocketServer(httpServer: any) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  // Middleware для аутентификации
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Токен не предоставлен'));
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return next(new Error('Неверный токен'));
    }

    // Проверка сессии в БД
    const sessionResult = await db.query(
      'SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (sessionResult.rows.length === 0) {
      return next(new Error('Сессия истекла'));
    }

    socket.data.userId = payload.userId;
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`User ${userId} connected`);

    // Присоединение к комнате поездки (для чата)
    socket.on('join-ride', async (rideId: string) => {
      // Проверка, что пользователь является участником поездки
      const isParticipant = await checkRideParticipation(userId, rideId);
      
      if (isParticipant) {
        socket.join(`ride-${rideId}`);
        console.log(`User ${userId} joined ride ${rideId}`);
      } else {
        socket.emit('error', { message: 'Вы не являетесь участником этой поездки' });
      }
    });

    // Отслеживание поездки (для геолокации)
    socket.on('join-tracking', async (rideId: string) => {
      const isParticipant = await checkRideParticipation(userId, rideId);
      
      if (isParticipant) {
        socket.join(`tracking-${rideId}`);
        console.log(`User ${userId} joined tracking for ride ${rideId}`);
      }
    });

    // Отключение
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
    });
  });

  return io;
}

/**
 * Проверка участия пользователя в поездке
 */
async function checkRideParticipation(userId: string, rideId: string): Promise<boolean> {
  // Проверяем, является ли пользователь водителем
  const rideResult = await db.query(
    'SELECT driver_id FROM rides WHERE id = $1',
    [rideId]
  );

  if (rideResult.rows.length === 0) return false;

  const ride = rideResult.rows[0];
  if (ride.driver_id === userId) return true;

  // Проверяем, является ли пользователь пассажиром
  const bookingResult = await db.query(
    'SELECT id FROM bookings WHERE ride_id = $1 AND passenger_id = $2 AND status IN ($3, $4)',
    [rideId, userId, 'pending', 'confirmed']
  );

  return bookingResult.rows.length > 0;
}

/**
 * Отправка сообщения всем участникам поездки
 */
export async function broadcastMessage(io: Server, rideId: string, message: any) {
  io.to(`ride-${rideId}`).emit('new-message', message);
}

/**
 * Отправка обновления местоположения
 */
export async function broadcastLocation(io: Server, rideId: string, location: any) {
  io.to(`tracking-${rideId}`).emit('location-update', location);
}
