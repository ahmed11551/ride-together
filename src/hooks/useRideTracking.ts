import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RideLocation {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

/**
 * Hook для отслеживания поездки в реальном времени
 * Использует Supabase Realtime для обновлений местоположения
 */
export const useRideTracking = (rideId: string | undefined, enabled: boolean = true) => {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<RideLocation | null>(null);

  // Получаем текущее местоположение поездки
  const { data: rideLocation, isLoading } = useQuery({
    queryKey: ['ride-tracking', rideId],
    queryFn: async () => {
      if (!rideId) return null;

      // Получаем последнее местоположение из БД
      const { data, error } = await supabase
        .from('ride_locations')
        .select('*')
        .eq('ride_id', rideId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Ошибка получения местоположения:', error);
        return null;
      }

      return data;
    },
    enabled: !!rideId && enabled,
    refetchInterval: 5000, // Обновляем каждые 5 секунд
  });

  // Подписка на обновления местоположения через Realtime
  useEffect(() => {
    if (!rideId || !enabled) return;

    const channel = supabase
      .channel(`ride-tracking-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_locations',
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          const newLocation = payload.new as any;
          setCurrentLocation({
            lat: newLocation.latitude,
            lng: newLocation.longitude,
            timestamp: newLocation.timestamp,
            speed: newLocation.speed || undefined,
            heading: newLocation.heading || undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
      const { error } = await supabase.from('ride_locations').insert({
        ride_id: rideId,
        driver_id: user.id,
        latitude: location.lat,
        longitude: location.lng,
        speed: location.speed || null,
        heading: location.heading || null,
        timestamp: new Date().toISOString(),
      });

      if (error) {
        console.error('Ошибка отправки местоположения:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Ошибка отправки местоположения:', error);
      return false;
    }
  };

  return { sendLocation };
};

