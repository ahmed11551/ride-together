import { useMemo } from 'react';
import Map, { Marker, Popup, MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { RideWithDriver } from '@/hooks/useRides';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface RidesMapProps {
  rides: RideWithDriver[];
  height?: string;
  className?: string;
}

// Простая функция для получения координат по названию города
// В продакшене лучше использовать геокодинг API
const getCityCoordinates = (cityName: string): { lat: number; lng: number } | null => {
  const cityMap: Record<string, { lat: number; lng: number }> = {
    москва: { lat: 55.7558, lng: 37.6173 },
    'санкт-петербург': { lat: 59.9343, lng: 30.3351 },
    новосибирск: { lat: 55.0084, lng: 82.9357 },
    екатеринбург: { lat: 56.8431, lng: 60.6454 },
    казань: { lat: 55.8304, lng: 49.0661 },
    нижний: { lat: 56.2965, lng: 43.9361 },
    'нижний новгород': { lat: 56.2965, lng: 43.9361 },
    челябинск: { lat: 55.1644, lng: 61.4368 },
    самара: { lat: 53.2001, lng: 50.15 },
    омск: { lat: 54.9885, lng: 73.3242 },
  };

  const normalized = cityName.toLowerCase().trim();
  return cityMap[normalized] || null;
};

export const RidesMap = ({ rides, height = '500px', className = '' }: RidesMapProps) => {
  const navigate = useNavigate();

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

  if (!MAPBOX_TOKEN) {
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
            Для отображения карты необходимо настроить Mapbox токен
          </p>
          <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            Добавьте <code className="bg-background px-1 rounded">VITE_MAPBOX_TOKEN</code> в переменные окружения
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <Map
        initialViewState={{
          ...centerCoords,
          zoom: centerCoords.zoom || 6,
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {markers.map((marker, index) => (
          <Marker
            key={marker.ride.id}
            longitude={marker.fromCoords.lng}
            latitude={marker.fromCoords.lat}
            anchor="bottom"
          >
            <div className="relative group">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:scale-110 transition-transform">
                <Car className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-card rounded-lg shadow-lg p-3 border border-border min-w-[200px]">
                  <p className="font-bold text-sm">
                    {marker.ride.from_city} → {marker.ride.to_city}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {marker.ride.price} ₽ • {marker.ride.seats_available} мест
                  </p>
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => navigate(`/ride/${marker.ride.id}`)}
                  >
                    Подробнее
                  </Button>
                </div>
              </div>
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
};

