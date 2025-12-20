/**
 * Сервис геокодинга для преобразования адресов в координаты
 * Поддерживает разные провайдеры (Yandex, OpenStreetMap, Google)
 */

interface Coordinates {
  lat: number;
  lng: number;
}

interface GeocodingResult {
  coordinates: Coordinates;
  address: string;
  city?: string;
  country?: string;
}

class GeocodingService {
  private provider: string = process.env.GEOCODING_PROVIDER || 'yandex';
  private cache: Map<string, GeocodingResult> = new Map();
  private cacheEnabled = process.env.GEOCODING_CACHE !== 'false';

  /**
   * Геокодинг через Yandex Maps API
   */
  private async geocodeYandex(address: string): Promise<GeocodingResult | null> {
    const apiKey = process.env.YANDEX_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('YANDEX_MAPS_API_KEY не установлен, геокодинг недоступен');
      return null;
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${encodedAddress}&format=json&results=1`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.response?.GeoObjectCollection?.featureMember?.length > 0) {
        const feature = data.response.GeoObjectCollection.featureMember[0];
        const geoObject = feature.GeoObject;
        const [lng, lat] = geoObject.Point.pos.split(' ').map(parseFloat);

        return {
          coordinates: { lat, lng },
          address: geoObject.metaDataProperty.GeocoderMetaData.text,
          city: geoObject.metaDataProperty.GeocoderMetaData.AddressDetails?.Country?.AdministrativeArea?.AdministrativeAreaName,
          country: geoObject.metaDataProperty.GeocoderMetaData.AddressDetails?.Country?.CountryName,
        };
      }
    } catch (error) {
      console.error('Yandex geocoding error:', error);
    }

    return null;
  }

  /**
   * Геокодинг через Nominatim (OpenStreetMap) - бесплатный
   */
  private async geocodeNominatim(address: string): Promise<GeocodingResult | null> {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RideTogether/1.0', // Требуется для Nominatim
        },
      });

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        return {
          coordinates: {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
          },
          address: result.display_name,
          city: result.address?.city || result.address?.town || result.address?.village,
          country: result.address?.country,
        };
      }
    } catch (error) {
      console.error('Nominatim geocoding error:', error);
    }

    return null;
  }

  /**
   * Геокодинг адреса в координаты
   */
  async geocode(address: string): Promise<GeocodingResult | null> {
    if (!address || address.trim().length === 0) {
      return null;
    }

    // Проверяем кеш
    const cacheKey = `${this.provider}:${address.toLowerCase().trim()}`;
    if (this.cacheEnabled && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let result: GeocodingResult | null = null;

    switch (this.provider) {
      case 'yandex':
        result = await this.geocodeYandex(address);
        break;
      case 'nominatim':
      case 'osm':
        result = await this.geocodeNominatim(address);
        break;
      default:
        console.warn(`Unknown geocoding provider: ${this.provider}, using Nominatim`);
        result = await this.geocodeNominatim(address);
    }

    // Сохраняем в кеш
    if (result && this.cacheEnabled) {
      this.cache.set(cacheKey, result);
      // Ограничиваем размер кеша (1000 записей)
      if (this.cache.size > 1000) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
    }

    return result;
  }

  /**
   * Обратный геокодинг - координаты в адрес
   */
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      if (this.provider === 'yandex') {
        const apiKey = process.env.YANDEX_MAPS_API_KEY;
        if (!apiKey) return null;

        const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${lng},${lat}&format=json&results=1`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.response?.GeoObjectCollection?.featureMember?.length > 0) {
          return data.response.GeoObjectCollection.featureMember[0].GeoObject.metaDataProperty.GeocoderMetaData.text;
        }
      } else {
        // Nominatim reverse geocoding
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'RideTogether/1.0',
          },
        });

        const data = await response.json();
        return data.display_name || null;
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }

    return null;
  }
}

export const geocodingService = new GeocodingService();

