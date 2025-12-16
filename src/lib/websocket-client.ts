/**
 * WebSocket клиент для Realtime функций (Socket.io)
 * Замена Supabase Realtime
 */

import { io, Socket } from 'socket.io-client';
import { env } from './env';
import { apiClient } from './api-client';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

type MessageHandler = (data: any) => void;
type EventHandlers = Map<string, Set<MessageHandler>>;

const eventHandlers: EventHandlers = new Map();

/**
 * Подключение к WebSocket серверу
 */
export function connectWebSocket(): Promise<Socket> {
  return new Promise((resolve, reject) => {
    if (socket && socket.connected) {
      resolve(socket);
      return;
    }

    const wsUrl = env.VITE_WS_URL;
    if (!wsUrl) {
      reject(new Error('VITE_WS_URL not configured'));
      return;
    }

    const token = apiClient.getToken();
    if (!token) {
      reject(new Error('Not authenticated'));
      return;
    }

    // Подключаемся к Socket.io серверу
    socket = io(wsUrl, {
      path: '/socket.io',
      transports: ['websocket'],
      auth: {
        token,
      },
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
      reconnectAttempts = 0;
      resolve(socket!);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      reconnectAttempts++;
      if (reconnectAttempts >= maxReconnectAttempts) {
        reject(error);
      }
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    // Обработка событий
    socket.onAny((event, data) => {
      handleMessage(event, data);
    });
  });
}

/**
 * Обработка входящих сообщений
 */
function handleMessage(event: string, data: any) {
  const handlers = eventHandlers.get(event);
  if (handlers) {
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }
}

/**
 * Подписка на события
 */
export function subscribe(event: string, handler: MessageHandler): () => void {
  if (!eventHandlers.has(event)) {
    eventHandlers.set(event, new Set());
  }
  
  eventHandlers.get(event)!.add(handler);

  // Подключаемся, если еще не подключены
  if (!socket || !socket.connected) {
    connectWebSocket().catch(console.error);
  } else {
    // Если уже подключены, подписываемся на событие
    socket.on(event, handler);
  }

  // Возвращаем функцию отписки
  return () => {
    const handlers = eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        eventHandlers.delete(event);
      }
    }
    
    if (socket) {
      socket.off(event, handler);
    }
  };
}

/**
 * Отправка сообщения через WebSocket
 */
export function sendMessage(type: string, data: any): void {
  if (!socket || !socket.connected) {
    console.error('WebSocket not connected');
    connectWebSocket().then(() => {
      socket?.emit(type, data);
    }).catch(console.error);
    return;
  }

  socket.emit(type, data);
}

/**
 * Отключение от WebSocket
 */
export function disconnectWebSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  
  eventHandlers.clear();
}

/**
 * Проверка подключения
 */
export function isConnected(): boolean {
  return socket !== null && socket.connected;
}
