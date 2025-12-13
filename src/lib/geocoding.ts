/**
 * Geocoding utilities for converting addresses to coordinates and vice versa
 * Using Yandex Maps Geocoding API
 */

import { env } from './env';

const YANDEX_MAPS_API_KEY = env.VITE_YANDEX_MAPS_API_KEY || '';

export interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
  city?: string;
}

/**
 * Geocode an address to coordinates using Yandex Maps Geocoding API
 */
export async function geocodeAddress(
  address: string
): Promise<GeocodeResult | null> {
  if (!YANDEX_MAPS_API_KEY) {
    console.warn('Yandex Maps API key not configured');
    // Fallback to city coordinates
    return getCityCoordinatesFallback(address);
  }

  try {
    const response = await fetch(
      `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_MAPS_API_KEY}&geocode=${encodeURIComponent(
        address
      )}&format=json&results=1&lang=ru_RU`
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();

    if (
      data.response?.GeoObjectCollection?.featureMember &&
      data.response.GeoObjectCollection.featureMember.length > 0
    ) {
      const feature = data.response.GeoObjectCollection.featureMember[0]
        .GeoObject;
      const [lng, lat] = feature.Point.pos.split(' ').map(Number);
      const addressText = feature.metaDataProperty.GeocoderMetaData.text;
      const city =
        feature.metaDataProperty.GeocoderMetaData.Address?.Components?.find(
          (c: any) => c.kind === 'locality'
        )?.name || addressText.split(',')[0];

      return {
        lat,
        lng,
        address: addressText,
        city,
      };
    }

    // Fallback to city coordinates
    return getCityCoordinatesFallback(address);
  } catch (error) {
    console.error('Geocoding error:', error);
    // Fallback to city coordinates
    return getCityCoordinatesFallback(address);
  }
}

export interface ParsedAddress {
  fullAddress: string;
  city?: string;
  street?: string;
  metro?: string;
  shortAddress: string; // Для отображения: "Москва, м. Бауманская" или "Москва, ул. Ленина"
}

/**
 * Reverse geocode coordinates to address using Yandex Maps Geocoding API
 * Returns parsed address with city, street, metro information
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ParsedAddress | null> {
  if (!YANDEX_MAPS_API_KEY) {
    console.warn('Yandex Maps API key not configured');
    return getFallbackAddress(lat, lng);
  }

  try {
    const response = await fetch(
      `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_MAPS_API_KEY}&geocode=${lng},${lat}&format=json&results=1&lang=ru_RU`
    );

    if (!response.ok) {
      // Если 403 или другая ошибка, используем fallback
      if (response.status === 403) {
        console.warn('Yandex Maps API: 403 Forbidden - возможно проблема с API ключом или квотой');
      }
      return getFallbackAddress(lat, lng);
    }

    const data = await response.json();

    if (
      data.response?.GeoObjectCollection?.featureMember &&
      data.response.GeoObjectCollection.featureMember.length > 0
    ) {
      const feature = data.response.GeoObjectCollection.featureMember[0]
        .GeoObject;
      const fullAddress = feature.metaDataProperty.GeocoderMetaData.text;
      const components = feature.metaDataProperty.GeocoderMetaData.Address?.Components || [];

      // Извлекаем компоненты адреса
      let city: string | undefined;
      let street: string | undefined;
      let metro: string | undefined;

      components.forEach((component: any) => {
        if (component.kind === 'locality' || component.kind === 'district') {
          city = component.name;
        } else if (component.kind === 'street') {
          street = component.name;
        } else if (component.kind === 'metro') {
          metro = component.name;
        }
      });

      // Если город не найден, берем из полного адреса
      if (!city) {
        city = fullAddress.split(',')[0];
      }

      // Формируем короткий адрес для отображения
      const parts: string[] = [];
      if (city) parts.push(city);
      if (metro) parts.push(`м. ${metro}`);
      if (street && !metro) parts.push(street);

      const shortAddress = parts.length > 0 ? parts.join(', ') : fullAddress;

      return {
        fullAddress,
        city,
        street,
        metro,
        shortAddress,
      };
    }

    return getFallbackAddress(lat, lng);
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return getFallbackAddress(lat, lng);
  }
}

/**
 * Fallback для получения адреса при ошибке API
 */
function getFallbackAddress(lat: number, lng: number): ParsedAddress | null {
  // Пытаемся определить город по координатам
  const city = getCityByCoordinates(lat, lng);
  
  if (city) {
    return {
      fullAddress: city,
      city,
      shortAddress: city,
    };
  }

  return null;
}

/**
 * Определяет город по координатам (приблизительно)
 */
function getCityByCoordinates(lat: number, lng: number): string | null {
  // Москва
  if (lat >= 55.5 && lat <= 56.0 && lng >= 37.0 && lng <= 38.0) {
    return 'Москва';
  }
  // Санкт-Петербург
  if (lat >= 59.8 && lat <= 60.0 && lng >= 30.0 && lng <= 30.7) {
    return 'Санкт-Петербург';
  }
  // Казань
  if (lat >= 55.7 && lat <= 55.9 && lng >= 48.9 && lng <= 49.3) {
    return 'Казань';
  }
  // Екатеринбург
  if (lat >= 56.7 && lat <= 56.9 && lng >= 60.4 && lng <= 60.7) {
    return 'Екатеринбург';
  }
  // Новосибирск
  if (lat >= 54.9 && lat <= 55.1 && lng >= 82.8 && lng <= 83.1) {
    return 'Новосибирск';
  }

  return null;
}

/**
 * Simple city name to coordinates mapping (fallback)
 */
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  москва: { lat: 55.7558, lng: 37.6173 },
  'санкт-петербург': { lat: 59.9343, lng: 30.3351 },
  'спб': { lat: 59.9343, lng: 30.3351 },
  новосибирск: { lat: 55.0084, lng: 82.9357 },
  екатеринбург: { lat: 56.8431, lng: 60.6454 },
  казань: { lat: 55.8304, lng: 49.0661 },
  'нижний новгород': { lat: 56.2965, lng: 43.9361 },
  нижний: { lat: 56.2965, lng: 43.9361 },
  челябинск: { lat: 55.1644, lng: 61.4368 },
  самара: { lat: 53.2001, lng: 50.15 },
  омск: { lat: 54.9885, lng: 73.3242 },
  ростов: { lat: 47.2357, lng: 39.7015 },
  'ростов-на-дону': { lat: 47.2357, lng: 39.7015 },
  уфа: { lat: 54.7348, lng: 55.9578 },
  красноярск: { lat: 56.0184, lng: 92.8672 },
  воронеж: { lat: 51.672, lng: 39.1843 },
  пермь: { lat: 58.0105, lng: 56.2502 },
};

/**
 * Get coordinates for a city name (fallback method)
 */
export function getCityCoordinates(cityName: string): {
  lat: number;
  lng: number;
} | null {
  const normalized = cityName.toLowerCase().trim();
  return cityCoordinates[normalized] || null;
}

/**
 * Fallback function for geocoding using city coordinates
 */
function getCityCoordinatesFallback(
  address: string
): GeocodeResult | null {
  const coords = getCityCoordinates(address);
  if (coords) {
    return {
      lat: coords.lat,
      lng: coords.lng,
      address,
      city: address,
    };
  }
  return null;
}
