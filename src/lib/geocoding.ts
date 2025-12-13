/**
 * Geocoding utilities for converting addresses to coordinates and vice versa
 */

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
  city?: string;
}

/**
 * Geocode an address to coordinates using Mapbox Geocoding API
 */
export async function geocodeAddress(
  address: string
): Promise<GeocodeResult | null> {
  if (!MAPBOX_TOKEN) {
    console.warn('Mapbox token not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json?access_token=${MAPBOX_TOKEN}&country=ru&language=ru&limit=1`
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const [lng, lat] = feature.center;
      const placeName = feature.place_name;

      // Extract city name
      const context = feature.context?.find((ctx: any) =>
        ctx.id.startsWith('place')
      );
      const city = context?.text || placeName.split(',')[0];

      return {
        lat,
        lng,
        address: placeName,
        city,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  if (!MAPBOX_TOKEN) {
    console.warn('Mapbox token not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&country=ru&language=ru&limit=1`
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }

    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
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

