import { useState, useCallback, useRef } from 'react';
import Map, { Marker, Source, Layer, MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

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

export const MapComponent = ({
  initialLocation,
  onLocationSelect,
  mode = 'view',
  height = '400px',
  className = '',
  showControls = true,
}: MapComponentProps) => {
  const [viewState, setViewState] = useState({
    longitude: initialLocation?.lng || 37.6173, // Москва по умолчанию
    latitude: initialLocation?.lat || 55.7558,
    zoom: initialLocation ? 12 : 5,
  });

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    initialLocation || null
  );
  const mapRef = useRef<MapRef>(null);

  const handleMapClick = useCallback(
    (event: any) => {
      if (mode === 'select' && onLocationSelect) {
        const { lng, lat } = event.lngLat;
        const location: Location = { lat, lng };
        setSelectedLocation(location);
        onLocationSelect(location);
      }
    },
    [mode, onLocationSelect]
  );

  const handleGeolocate = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location: Location = { lat: latitude, lng: longitude };
          setViewState({
            longitude,
            latitude,
            zoom: 12,
          });
          setSelectedLocation(location);
          if (onLocationSelect) {
            onLocationSelect(location);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }, [onLocationSelect]);

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
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        cursor={mode === 'select' ? 'crosshair' : 'default'}
      >
        {selectedLocation && (
          <Marker
            longitude={selectedLocation.lng}
            latitude={selectedLocation.lat}
            anchor="bottom"
          >
            <div className="relative">
              <MapPin className="w-8 h-8 text-primary fill-primary" />
              {selectedLocation.address && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-card rounded shadow-lg text-xs whitespace-nowrap border border-border">
                  {selectedLocation.address}
                </div>
              )}
            </div>
          </Marker>
        )}

        {showControls && (
          <div className="absolute top-4 right-4 flex flex-col gap-2">
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
      </Map>
    </div>
  );
};

