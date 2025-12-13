import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { getCityCoordinates } from '@/lib/geocoding';
import { buildRoute, formatDistance, formatDuration } from '@/lib/routing';
import { env } from '@/lib/env';
import type { Ride } from '@/hooks/useRides';
import type { YandexMapsAPI, YandexMapsMap, YandexMapsPolyline } from '@/lib/yandex-maps-types';

const YANDEX_MAPS_API_KEY = env.VITE_YANDEX_MAPS_API_KEY || '';

interface RideRouteMapProps {
  ride: Ride;
  height?: string;
  className?: string;
}

declare global {
  interface Window {
    ymaps: YandexMapsAPI;
  }
}

/**
 * Component to display a single ride route on the map
 * Shows the route between from and to locations
 */
export function RideRouteMap({ ride, height = '400px', className = '' }: RideRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<YandexMapsMap | null>(null);
  const routeRef = useRef<YandexMapsPolyline | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  const fromCoords = getCityCoordinates(ride.from_city);
  const toCoords = getCityCoordinates(ride.to_city);

  // Загрузка Yandex Maps API
  useEffect(() => {
    if (!YANDEX_MAPS_API_KEY) {
      return;
    }

    if (window.ymaps) {
      window.ymaps.ready(() => setIsLoaded(true));
      return;
    }

    // Загружаем Yandex Maps API с defer для оптимизации
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_MAPS_API_KEY}&lang=ru_RU&load=package.full`;
    script.async = true;
    script.defer = true; // Отложенная загрузка
    script.onload = () => {
      window.ymaps.ready(() => setIsLoaded(true));
    };
    script.onerror = () => {
      import('@/lib/logger').then(({ logger }) => {
        logger.error('Failed to load Yandex Maps API');
      });
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }
    };
  }, []);

  // Инициализация карты и маршрута
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !YANDEX_MAPS_API_KEY || !fromCoords || !toCoords) {
      return;
    }

    window.ymaps.ready(async () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }

      // Вычисляем центр для карты
      const centerLat = (fromCoords.lat + toCoords.lat) / 2;
      const centerLng = (fromCoords.lng + toCoords.lng) / 2;

      // Минимальный набор контролов для оптимизации производительности
      const map = new window.ymaps.Map(mapRef.current, {
        center: [centerLat, centerLng],
        zoom: 7,
        controls: ['zoomControl'], // Только зум для экономии ресурсов
        behaviors: ['default', 'scrollZoom'], // Отключаем лишние поведения
      });

      mapInstanceRef.current = map;

      // Маркер отправления
      const fromMarker = new window.ymaps.Placemark(
        [fromCoords.lat, fromCoords.lng],
        {
          iconContent: 'A',
          balloonContentHeader: 'Откуда',
          balloonContentBody: ride.from_address || ride.from_city,
        },
        {
          preset: 'islands#greenCircleIcon',
        }
      );

      // Маркер назначения
      const toMarker = new window.ymaps.Placemark(
        [toCoords.lat, toCoords.lng],
        {
          iconContent: 'B',
          balloonContentHeader: 'Куда',
          balloonContentBody: ride.to_address || ride.to_city,
        },
        {
          preset: 'islands#redCircleIcon',
        }
      );

      map.geoObjects.add(fromMarker);
      map.geoObjects.add(toMarker);

      // Строим маршрут
      try {
        const route = await buildRoute(fromCoords, toCoords);

        if (route && route.points.length > 1) {
          const routePoints = route.points.map(
            (point) => [point.lat, point.lng] as [number, number]
          );

          const polyline = new window.ymaps.Polyline(routePoints, {}, {
            strokeColor: '#0d9488',
            strokeWidth: 5,
            strokeOpacity: 0.8,
          });

          map.geoObjects.add(polyline);
          routeRef.current = polyline;

          // Сохраняем информацию о маршруте
          setRouteInfo({
            distance: formatDistance(route.distance),
            duration: formatDuration(route.duration),
          });
        } else {
          // Если не удалось построить маршрут, рисуем прямую линию
          const polyline = new window.ymaps.Polyline(
            [
              [fromCoords.lat, fromCoords.lng],
              [toCoords.lat, toCoords.lng],
            ],
            {},
            {
              strokeColor: '#0d9488',
              strokeWidth: 3,
              strokeOpacity: 0.5,
              strokeStyle: '5 5',
            }
          );
          map.geoObjects.add(polyline);
          routeRef.current = polyline;
        }
      } catch (error) {
        import('@/lib/logger').then(({ logger }) => {
          logger.error('Error building route', error);
        });
        // Рисуем прямую линию при ошибке
        const polyline = new window.ymaps.Polyline(
          [
            [fromCoords.lat, fromCoords.lng],
            [toCoords.lat, toCoords.lng],
          ],
          {},
          {
            strokeColor: '#0d9488',
            strokeWidth: 3,
            strokeOpacity: 0.5,
            strokeStyle: '5 5',
          }
        );
        map.geoObjects.add(polyline);
        routeRef.current = polyline;
      }

      // Подстраиваем границы карты под маркеры и маршрут
      const bounds = map.geoObjects.getBounds();
      if (bounds) {
        map.setBounds(bounds, {
          checkZoomRange: true,
          duration: 300,
          padding: [50, 50, 50, 50],
        });
      }
    });
  }, [isLoaded, fromCoords, toCoords, ride]);

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
          <p className="text-sm text-muted-foreground">
            Для отображения карты необходимо настроить Yandex Maps API ключ
          </p>
        </div>
      </div>
    );
  }

  if (!fromCoords || !toCoords) {
    return (
      <div
        className={`bg-muted rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-medium mb-2">
            Не удалось определить координаты
          </p>
          <p className="text-sm text-muted-foreground">
            {ride.from_city} → {ride.to_city}
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

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div
        ref={mapRef}
        style={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}
      />
      {routeInfo && (
        <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border">
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Расстояние: </span>
              <span className="font-semibold">{routeInfo.distance}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Время: </span>
              <span className="font-semibold">{routeInfo.duration}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

