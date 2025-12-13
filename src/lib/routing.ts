/**
 * Routing utilities for building routes between points
 * Using Yandex Maps Routing API
 */

import { env } from './env';

const YANDEX_MAPS_API_KEY = env.VITE_YANDEX_MAPS_API_KEY || '';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface Route {
  points: RoutePoint[];
  distance: number; // в метрах
  duration: number; // в секундах
}

/**
 * Build route between two points using Yandex Maps Routing API
 */
export async function buildRoute(
  from: RoutePoint,
  to: RoutePoint
): Promise<Route | null> {
  if (!YANDEX_MAPS_API_KEY) {
    console.warn('Yandex Maps API key not configured');
    // Return simple straight line route
    return {
      points: [from, to],
      distance: calculateDistance(from, to),
      duration: calculateDuration(from, to),
    };
  }

  try {
    const response = await fetch(
      `https://api.routing.yandex.net/v2/route?apikey=${YANDEX_MAPS_API_KEY}&waypoints=${from.lat},${from.lng}|${to.lat},${to.lng}&mode=auto&lang=ru_RU`
    );

    if (!response.ok) {
      console.warn('Routing API error:', response.status);
      // Return simple straight line route as fallback
      return {
        points: [from, to],
        distance: calculateDistance(from, to),
        duration: calculateDuration(from, to),
      };
    }

    const data = await response.json();

    if (data.route && data.route.legs && data.route.legs.length > 0) {
      const leg = data.route.legs[0];
      const points: RoutePoint[] = [];

      // Extract route points from geometry
      if (leg.steps) {
        leg.steps.forEach((step: any) => {
          if (step.geometry) {
            // Decode polyline if needed
            const stepPoints = decodePolyline(step.geometry);
            points.push(...stepPoints);
          }
        });
      }

      // If no detailed points, use start and end
      if (points.length === 0) {
        points.push(from, to);
      }

      return {
        points,
        distance: leg.distance?.value || calculateDistance(from, to),
        duration: leg.duration?.value || calculateDuration(from, to),
      };
    }

    // Fallback to straight line
    return {
      points: [from, to],
      distance: calculateDistance(from, to),
      duration: calculateDuration(from, to),
    };
  } catch (error) {
    console.error('Routing error:', error);
    // Return simple straight line route as fallback
    return {
      points: [from, to],
      distance: calculateDistance(from, to),
      duration: calculateDuration(from, to),
    };
  }
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(from: RoutePoint, to: RoutePoint): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate estimated duration based on distance
 */
function calculateDuration(from: RoutePoint, to: RoutePoint): number {
  const distance = calculateDistance(from, to);
  const avgSpeed = 60; // km/h
  const speedMs = (avgSpeed * 1000) / 3600; // m/s
  return Math.round(distance / speedMs);
}

/**
 * Decode polyline string to array of points
 * Simple implementation for Yandex Maps polyline format
 */
function decodePolyline(encoded: string): RoutePoint[] {
  const points: RoutePoint[] = [];
  try {
    // Yandex Maps uses a specific polyline format
    // This is a simplified decoder
    const coords = encoded.split(';');
    coords.forEach((coord) => {
      const [lng, lat] = coord.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        points.push({ lat, lng });
      }
    });
  } catch (error) {
    console.error('Polyline decode error:', error);
  }
  return points;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} м`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1)} км`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }
  return `${minutes} мин`;
}

