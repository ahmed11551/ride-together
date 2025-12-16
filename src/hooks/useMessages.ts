import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { notifyNewMessage } from "@/lib/notifications";
import { subscribe, sendMessage, connectWebSocket } from "@/lib/websocket-client";

export interface Message {
  id: string;
  ride_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const useMessages = (rideId: string | undefined) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const messagesQuery = useQuery({
    queryKey: ["messages", rideId],
    queryFn: async () => {
      if (!rideId) return [];

      const data = await apiClient.get<Message[]>(`/api/messages/${rideId}`);
      return data;
    },
    enabled: !!rideId && !!user,
  });

  // Подписка на WebSocket обновления
  useEffect(() => {
    if (!rideId || !user) return;

    // Подключаемся к WebSocket
    connectWebSocket().catch(console.error);

    // Подписываемся на новые сообщения
    const unsubscribe = subscribe('new-message', (message: Message) => {
      if (message.ride_id === rideId) {
        queryClient.setQueryData<Message[]>(["messages", rideId], (old = []) => {
          // Избегаем дубликатов
          if (old.some((m) => m.id === message.id)) return old;
          return [...old, message];
        });
      }
    });

    // Присоединяемся к комнате поездки
    sendMessage('join-ride', { rideId });

    return () => {
      unsubscribe();
      sendMessage('leave-ride', { rideId });
    };
  }, [rideId, user, queryClient]);

  return messagesQuery;
};

export const useSendMessage = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ rideId, content }: { rideId: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");

      const data = await apiClient.post<Message>('/api/messages', {
        ride_id: rideId,
        content: content.trim(),
      });

      // Отправляем уведомления получателям (асинхронно, не блокируем)
      if (data) {
        sendMessageNotifications(rideId, user.id, content).catch((err) => {
          import('@/lib/logger').then(({ logger }) => {
            logger.error('Ошибка отправки уведомлений', err);
          });
        });
      }

      return data;
    },
  });
};

/**
 * Отправка уведомлений о новом сообщении всем участникам поездки
 */
async function sendMessageNotifications(
  rideId: string,
  senderId: string,
  messageContent: string
): Promise<void> {
  try {
    // Получаем информацию о поездке
    const ride = await apiClient.get<{ driver_id: string }>(`/api/rides/${rideId}`);
    if (!ride) return;

    // Получаем информацию об отправителе
    const senderProfile = await apiClient.get<{ full_name: string | null }>(`/api/profiles/${senderId}`);
    const senderName = senderProfile?.full_name || "Пользователь";

    // Получаем всех участников чата (водитель + забронировавшие пассажиры)
    const bookings = await apiClient.get<{ passenger_id: string; status: string }[]>(`/api/bookings/ride/${rideId}`);
    
    const recipientIds = new Set<string>();
    
    // Добавляем водителя (если не отправитель)
    if (ride.driver_id !== senderId) {
      recipientIds.add(ride.driver_id);
    }

    // Добавляем пассажиров (если не отправитель)
    bookings
      .filter(b => b.status === 'pending' || b.status === 'confirmed')
      .forEach((booking) => {
        if (booking.passenger_id !== senderId) {
          recipientIds.add(booking.passenger_id);
        }
      });

    // Отправляем уведомления всем получателям
    await Promise.allSettled(
      Array.from(recipientIds).map((recipientId) =>
        notifyNewMessage(recipientId, rideId, senderName, messageContent)
      )
    );
  } catch (error) {
    import('@/lib/logger').then(({ logger }) => {
      logger.error("Ошибка отправки уведомлений о сообщении", error);
    });
  }
}

export const useCanAccessChat = (rideId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["canAccessChat", rideId, user?.id],
    queryFn: async () => {
      if (!rideId || !user) return false;

      // Check if user is the driver
      const ride = await apiClient.get<{ driver_id: string }>(`/api/rides/${rideId}`);
      if (ride?.driver_id === user.id) return true;

      // Check if user has a booking for this ride
      const myBookings = await apiClient.get<{ ride_id: string; status: string }[]>('/api/bookings');
      return myBookings.some(b => 
        b.ride_id === rideId && 
        (b.status === 'pending' || b.status === 'confirmed')
      );
    },
    enabled: !!rideId && !!user,
  });
};
