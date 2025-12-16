import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { subscribe, sendMessage, connectWebSocket } from '@/lib/websocket-client';

export interface RideLocation {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

/**
 * Hook для отслеживания поездки в реальном времени
 * Использует WebSocket для обновлений местоположения
 */
export const useRideTracking = (rideId: string | undefined, enabled: boolean = true) => {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<RideLocation | null>(null);

  // Получаем текущее местоположение поездки
  // TODO: Создать API endpoint для получения последнего местоположения
  const { data: rideLocation, isLoading } = useQuery({
    queryKey: ['ride-tracking', rideId],
    queryFn: async () => {
      if (!rideId) return null;

      // Временно возвращаем null, пока не создан endpoint
      // В будущем: const data = await apiClient.get(`/api/rides/${rideId}/location`);
      return null;
    },
    enabled: !!rideId && enabled,
    refetchInterval: 5000, // Обновляем каждые 5 секунд
  });

  // Подписка на обновления местоположения через WebSocket
  useEffect(() => {
    if (!rideId || !enabled) return;

    // Подключаемся к WebSocket
    connectWebSocket().catch(console.error);

    // Присоединяемся к отслеживанию поездки
    sendMessage('join-tracking', { rideId });

    // Подписываемся на обновления местоположения
    const unsubscribe = subscribe('location-update', (data) => {
      if (data.ride_id === rideId) {
        setCurrentLocation({
          lat: data.latitude,
          lng: data.longitude,
          timestamp: data.timestamp,
          speed: data.speed || undefined,
          heading: data.heading || undefined,
        });
      }
    });

    return () => {
      unsubscribe();
      sendMessage('leave-tracking', { rideId });
    };
  }, [rideId, enabled]);

  // Обновляем текущее местоположение при получении данных
  useEffect(() => {
    if (rideLocation) {
      setCurrentLocation({
        lat: rideLocation.latitude,
        lng: rideLocation.longitude,
        timestamp: rideLocation.timestamp,
        speed: rideLocation.speed || undefined,
        heading: rideLocation.heading || undefined,
      });
    }
  }, [rideLocation]);

  return {
    currentLocation,
    isLoading,
  };
};

/**
 * Hook для отправки местоположения водителя во время поездки
 */
export const useSendRideLocation = () => {
  const { user } = useAuth();

  const sendLocation = async (
    rideId: string,
    location: { lat: number; lng: number; speed?: number; heading?: number }
  ): Promise<boolean> => {
    if (!user) {
      console.warn('Пользователь не авторизован');
      return false;
    }

    try {
      // Отправляем через WebSocket
      sendMessage('location-update', {
        ride_id: rideId,
        driver_id: user.id,
        latitude: location.lat,
        longitude: location.lng,
        speed: location.speed || null,
        heading: location.heading || null,
        timestamp: new Date().toISOString(),
      });

      // TODO: Также сохранять в БД через API endpoint
      // await apiClient.post(`/api/rides/${rideId}/location`, { ... });

      return true;
    } catch (error) {
      console.error('Ошибка отправки местоположения:', error);
      return false;
    }
  };

  return { sendLocation };
};
