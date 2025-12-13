import { useState, useCallback, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const YANDEX_MAPS_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface MapComponentProps {
  initialLocation?: Location;
  onLocationSelect?: (location: Location) => void;
  mode?: 'view' | 'select';
  height?: string;
  className?: string;
  showControls?: boolean;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

export const MapComponent = ({
  initialLocation,
  onLocationSelect,
  mode = 'view',
  height = '400px',
  className = '',
  showControls = true,
}: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    initialLocation || null
  );

  // Загрузка Yandex Maps API
  useEffect(() => {
    if (!YANDEX_MAPS_API_KEY) {
      return;
    }

    // Проверяем, не загружен ли уже API
    if (window.ymaps) {
      window.ymaps.ready(() => setIsLoaded(true));
      return;
    }

    // Загружаем Yandex Maps API
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_MAPS_API_KEY}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      window.ymaps.ready(() => setIsLoaded(true));
    };
    document.head.appendChild(script);

    return () => {
      // Очистка при размонтировании
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }
    };
  }, []);

  // Инициализация карты
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !YANDEX_MAPS_API_KEY) {
      return;
    }

    const center = initialLocation
      ? [initialLocation.lat, initialLocation.lng]
      : [55.7558, 37.6173]; // Москва по умолчанию

    const zoom = initialLocation ? 12 : 5;

    // Создаем карту
    window.ymaps.ready(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }

      const map = new window.ymaps.Map(mapRef.current, {
        center,
        zoom,
        controls: ['zoomControl', 'fullscreenControl'],
      });

      mapInstanceRef.current = map;

      // Добавляем маркер, если есть начальная локация
      if (initialLocation) {
        const marker = new window.ymaps.Placemark(
          [initialLocation.lat, initialLocation.lng],
          {
            iconCaption: initialLocation.address || 'Выбранная точка',
          },
          {
            preset: 'islands#blueIcon',
          }
        );
        map.geoObjects.add(marker);
        markerRef.current = marker;
      }

      // Обработчик клика на карте
      if (mode === 'select') {
        map.events.add('click', (e: any) => {
          const coords = e.get('coords');
          const location: Location = {
            lat: coords[0],
            lng: coords[1],
          };

          // Удаляем старый маркер
          if (markerRef.current) {
            map.geoObjects.remove(markerRef.current);
          }

          // Добавляем новый маркер
          const marker = new window.ymaps.Placemark(
            [location.lat, location.lng],
            {
              iconCaption: 'Выбранная точка',
            },
            {
              preset: 'islands#blueIcon',
            }
          );
          map.geoObjects.add(marker);
          markerRef.current = marker;

          setSelectedLocation(location);

          // Получаем адрес через геокодер
          window.ymaps.geocode([location.lat, location.lng]).then((res: any) => {
            const firstGeoObject = res.geoObjects.get(0);
            const address = firstGeoObject
              ? firstGeoObject.getAddressLine()
              : null;
            const locationWithAddress = { ...location, address };
            setSelectedLocation(locationWithAddress);
            if (onLocationSelect) {
              onLocationSelect(locationWithAddress);
            }
          });
        });
      }
    });
  }, [isLoaded, initialLocation, mode, onLocationSelect]);

  const handleGeolocate = useCallback(() => {
    if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location: Location = { lat: latitude, lng: longitude };

          mapInstanceRef.current.setCenter([latitude, longitude], 12);

          // Удаляем старый маркер
          if (markerRef.current) {
            mapInstanceRef.current.geoObjects.remove(markerRef.current);
          }

          // Добавляем новый маркер
          if (window.ymaps) {
            window.ymaps.geocode([latitude, longitude]).then((res: any) => {
              const firstGeoObject = res.geoObjects.get(0);
              const address = firstGeoObject
                ? firstGeoObject.getAddressLine()
                : null;
              const locationWithAddress = { ...location, address };

              const marker = new window.ymaps.Placemark(
                [latitude, longitude],
                {
                  iconCaption: address || 'Моё местоположение',
                },
                {
                  preset: 'islands#blueIcon',
                }
              );
              mapInstanceRef.current.geoObjects.add(marker);
              markerRef.current = marker;

              setSelectedLocation(locationWithAddress);
              if (onLocationSelect) {
                onLocationSelect(locationWithAddress);
              }
            });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }, [onLocationSelect]);

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

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div
        ref={mapRef}
        style={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}
      />

      {showControls && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          {mode === 'select' && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleGeolocate}
              className="bg-card shadow-lg"
            >
              📍 Моё местоположение
            </Button>
          )}
          {selectedLocation && mode === 'select' && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (markerRef.current && mapInstanceRef.current) {
                  mapInstanceRef.current.geoObjects.remove(markerRef.current);
                  markerRef.current = null;
                }
                setSelectedLocation(null);
                if (onLocationSelect) {
                  onLocationSelect({ lat: 0, lng: 0 });
                }
              }}
              className="bg-card shadow-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
