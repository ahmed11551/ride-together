import { useMemo, useEffect, useRef, useState } from 'react';
import { MapPin, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { RideWithDriver } from '@/hooks/useRides';
import { getCityCoordinates } from '@/lib/geocoding';
import { env } from '@/lib/env';

const YANDEX_MAPS_API_KEY = env.VITE_YANDEX_MAPS_API_KEY || '';

interface RidesMapProps {
  rides: RideWithDriver[];
  height?: string;
  className?: string;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

export const RidesMap = ({ rides, height = '500px', className = '' }: RidesMapProps) => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const markers = useMemo(() => {
    return rides
      .map((ride) => {
        const fromCoords = getCityCoordinates(ride.from_city);
        const toCoords = getCityCoordinates(ride.to_city);

        if (!fromCoords || !toCoords) return null;

        return {
          ride,
          fromCoords,
          toCoords,
          centerCoords: {
            lat: (fromCoords.lat + toCoords.lat) / 2,
            lng: (fromCoords.lng + toCoords.lng) / 2,
          },
        };
      })
      .filter(Boolean) as Array<{
      ride: RideWithDriver;
      fromCoords: { lat: number; lng: number };
      toCoords: { lat: number; lng: number };
      centerCoords: { lat: number; lng: number };
    }>;
  }, [rides]);

  const centerCoords = useMemo(() => {
    if (markers.length === 0) {
      return { lat: 55.7558, lng: 37.6173, zoom: 5 }; // Москва по умолчанию
    }

    if (markers.length === 1) {
      return {
        ...markers[0].centerCoords,
        zoom: 8,
      };
    }

    // Вычисляем центр всех маркеров
    const avgLat =
      markers.reduce((sum, m) => sum + m.centerCoords.lat, 0) / markers.length;
    const avgLng =
      markers.reduce((sum, m) => sum + m.centerCoords.lng, 0) / markers.length;

    return {
      lat: avgLat,
      lng: avgLng,
      zoom: 6,
    };
  }, [markers]);

  // Загрузка Yandex Maps API
  useEffect(() => {
    if (!YANDEX_MAPS_API_KEY) {
      return;
    }

    if (window.ymaps) {
      window.ymaps.ready(() => setIsLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_MAPS_API_KEY}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      window.ymaps.ready(() => setIsLoaded(true));
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }
    };
  }, []);

  // Инициализация карты и маркеров
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !YANDEX_MAPS_API_KEY || markers.length === 0) {
      return;
    }

    window.ymaps.ready(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }

      const map = new window.ymaps.Map(mapRef.current, {
        center: [centerCoords.lat, centerCoords.lng],
        zoom: centerCoords.zoom || 6,
        controls: ['zoomControl', 'fullscreenControl'],
      });

      mapInstanceRef.current = map;

      // Очищаем старые маркеры
      markersRef.current.forEach((marker) => {
        map.geoObjects.remove(marker);
      });
      markersRef.current = [];

      // Добавляем новые маркеры
      markers.forEach((markerData) => {
        const marker = new window.ymaps.Placemark(
          [markerData.fromCoords.lat, markerData.fromCoords.lng],
          {
            balloonContentHeader: `${markerData.ride.from_city} → ${markerData.ride.to_city}`,
            balloonContentBody: `${markerData.ride.price} ₽ • ${markerData.ride.seats_available} мест`,
            balloonContentFooter: `<button onclick="window.navigateToRide('${markerData.ride.id}')" class="bg-primary text-white px-4 py-2 rounded">Подробнее</button>`,
            hintContent: `${markerData.ride.from_city} → ${markerData.ride.to_city}`,
          },
          {
            preset: 'islands#blueAutoIcon',
          }
        );

        marker.events.add('click', () => {
          navigate(`/ride/${markerData.ride.id}`);
        });

        map.geoObjects.add(marker);
        markersRef.current.push(marker);
      });

      // Автоматически подстраиваем границы карты под все маркеры
      if (markers.length > 1) {
        const bounds = map.geoObjects.getBounds();
        if (bounds) {
          map.setBounds(bounds, {
            checkZoomRange: true,
            duration: 300,
          });
        }
      }
    });
  }, [isLoaded, markers, centerCoords, navigate]);

  if (!YANDEX_MAPS_API_KEY) {
    return (
      <div
        className={`bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20 ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6 max-w-sm">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-medium mb-2">
            Карта недоступна
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Для отображения карты необходимо настроить Yandex Maps API ключ
          </p>
          <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            Добавьте <code className="bg-background px-1 rounded">VITE_YANDEX_MAPS_API_KEY</code> в переменные окружения
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Получите ключ на{' '}
            <a
              href="https://developer.tech.yandex.ru/services/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              developer.tech.yandex.ru
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`bg-muted rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Загрузка карты...</p>
        </div>
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <div
        className={`bg-muted rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-medium mb-2">
            Нет поездок для отображения
          </p>
          <p className="text-sm text-muted-foreground">
            На карте будут показаны поездки с известными координатами
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div
        ref={mapRef}
        style={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}
      />
    </div>
  );
};
