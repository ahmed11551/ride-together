/**
 * Утилиты для расчета расстояний между точками
 */

interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Расчет расстояния между двумя точками по формуле Гаверсинуса (Haversine)
 * Возвращает расстояние в километрах
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371; // Радиус Земли в километрах
  const dLat = toRadians(point2.lat - point1.lat);
  const dLon = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Округляем до 2 знаков
}

/**
 * Преобразование градусов в радианы
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Находит ближайшие точки к заданной точке в радиусе
 */
export function findPointsInRadius(
  center: Coordinates,
  points: Array<{ coordinates: Coordinates; [key: string]: any }>,
  radiusKm: number
): Array<{ coordinates: Coordinates; distance: number; [key: string]: any }> {
  return points
    .map((point) => ({
      ...point,
      distance: calculateDistance(center, point.coordinates),
    }))
    .filter((point) => point.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Форматирование расстояния для отображения
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} м`;
  } else if (km < 10) {
    return `${km.toFixed(1)} км`;
  } else {
    return `${Math.round(km)} км`;
  }
}

