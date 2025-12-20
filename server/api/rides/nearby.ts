/**
 * API endpoint для поиска поездок поблизости
 * GET /api/rides/nearby?lat=55.7558&lng=37.6173&radius=50
 */

import { Request, Response } from 'express';
import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { logger } from '../../utils/logger.js';
import { calculateDistance } from '../../utils/distance.js';

export async function findNearbyRides(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const userId = token ? verifyToken(token)?.userId : null;

    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat((req.query.radius as string) || '50'); // радиус в км

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: 'Параметры lat и lng обязательны' });
      return;
    }

    // Получаем поездки с координатами
    const ridesResult = await db.query(
      `SELECT 
        r.*,
        p.full_name as driver_full_name,
        p.avatar_url as driver_avatar_url,
        p.rating as driver_rating,
        p.trips_count as driver_trips_count,
        p.is_verified as driver_is_verified,
        rc.from_lat, rc.from_lng, rc.to_lat, rc.to_lng
      FROM rides r
      LEFT JOIN profiles p ON r.driver_id = p.user_id
      LEFT JOIN ride_coordinates rc ON r.id = rc.ride_id
      WHERE r.status = 'active'
        AND (rc.from_lat IS NOT NULL OR rc.to_lat IS NOT NULL)
      ORDER BY r.departure_date ASC
      LIMIT 100`
    );

    // Фильтруем поездки по радиусу
    const centerPoint = { lat, lng };
    const nearbyRides = ridesResult.rows
      .filter((ride) => {
        if (ride.from_lat && ride.from_lng) {
          const distance = calculateDistance(
            centerPoint,
            { lat: parseFloat(ride.from_lat), lng: parseFloat(ride.from_lng) }
          );
          return distance <= radius;
        }
        return false;
      })
      .map((ride) => {
        const fromDistance = ride.from_lat && ride.from_lng
          ? calculateDistance(
              centerPoint,
              { lat: parseFloat(ride.from_lat), lng: parseFloat(ride.from_lng) }
            )
          : null;

        return {
          id: ride.id,
          driver_id: ride.driver_id,
          from_city: ride.from_city,
          from_address: ride.from_address,
          to_city: ride.to_city,
          to_address: ride.to_address,
          departure_date: ride.departure_date,
          departure_time: ride.departure_time,
          estimated_duration: ride.estimated_duration,
          price: parseFloat(ride.price),
          seats_total: ride.seats_total,
          seats_available: ride.seats_available,
          status: ride.status,
          allow_smoking: ride.allow_smoking,
          allow_pets: ride.allow_pets,
          allow_music: ride.allow_music,
          notes: ride.notes,
          created_at: ride.created_at,
          updated_at: ride.updated_at,
          distance: fromDistance,
          driver: ride.driver_full_name ? {
            full_name: ride.driver_full_name,
            avatar_url: ride.driver_avatar_url,
            rating: parseFloat(ride.driver_rating || '5.0'),
            trips_count: ride.driver_trips_count || 0,
            is_verified: ride.driver_is_verified || false,
          } : undefined,
        };
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));

    res.status(200).json({
      rides: nearbyRides,
      center: { lat, lng },
      radius,
      count: nearbyRides.length,
    });
  } catch (error: any) {
    logger.error('Find nearby rides error', error, { userId: (req as any).userId });
    res.status(500).json({ error: 'Ошибка при поиске поездок поблизости' });
  }
}

