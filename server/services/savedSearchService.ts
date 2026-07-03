/**
 * Сервис сохранённых поисков и уведомлений о новых поездках
 */

import { db } from '../utils/database.js';
import { notificationService } from './notificationService.js';
import { logger } from '../utils/logger.js';

export interface RideForMatching {
  id: string;
  driver_id: string;
  from_city: string;
  to_city: string;
  departure_date: string;
  departure_time: string;
  price: number;
  seats_available: number;
  allow_smoking: boolean;
  allow_pets: boolean;
  allow_music: boolean;
}

interface MatchedSearch {
  searchId: string;
  userId: string;
  searchName: string | null;
  fromCity: string | null;
  toCity: string | null;
}

function normalizeCity(city: string): string {
  return city.trim().toLowerCase();
}

function citiesMatch(saved: string | null, rideCity: string): boolean {
  if (!saved) return true;
  const a = normalizeCity(saved);
  const b = normalizeCity(rideCity);
  return b.includes(a) || a.includes(b);
}

/**
 * Находит сохранённые поиски, подходящие под новую поездку
 */
export async function findMatchingSavedSearches(ride: RideForMatching): Promise<MatchedSearch[]> {
  const driverResult = await db.query(
    'SELECT rating FROM profiles WHERE user_id = $1',
    [ride.driver_id]
  );
  const driverRating = parseFloat(driverResult.rows[0]?.rating ?? '5');

  const result = await db.query(
    `SELECT ss.id, ss.user_id, ss.name, ss.from_city, ss.to_city, ss.date, ss.date_from, ss.date_to,
            ss.passengers, ss.min_price, ss.max_price, ss.allow_smoking, ss.allow_pets, ss.allow_music,
            ss.min_rating
     FROM saved_searches ss
     JOIN profiles p ON p.user_id = ss.user_id
     WHERE ss.user_id != $1
       AND COALESCE(ss.notify_telegram, true) = true
       AND COALESCE(p.telegram_notifications, false) = true
       AND p.telegram_id IS NOT NULL`,
    [ride.driver_id]
  );

  const matches: MatchedSearch[] = [];

  for (const row of result.rows) {
    if (!citiesMatch(row.from_city, ride.from_city)) continue;
    if (!citiesMatch(row.to_city, ride.to_city)) continue;

    if (row.date && row.date !== ride.departure_date) continue;
    if (row.date_from && ride.departure_date < row.date_from) continue;
    if (row.date_to && ride.departure_date > row.date_to) continue;

    const passengers = row.passengers || 1;
    if (ride.seats_available < passengers) continue;

    const price = ride.price;
    if (row.min_price != null && price < parseFloat(row.min_price)) continue;
    if (row.max_price != null && price > parseFloat(row.max_price)) continue;

    if (row.allow_smoking === false && ride.allow_smoking) continue;
    if (row.allow_pets === true && !ride.allow_pets) continue;
    if (row.allow_music === true && !ride.allow_music) continue;

    if (row.min_rating != null && driverRating < parseFloat(row.min_rating)) continue;

    matches.push({
      searchId: row.id,
      userId: row.user_id,
      searchName: row.name,
      fromCity: row.from_city,
      toCity: row.to_city,
    });
  }

  return matches;
}

async function wasAlreadyNotified(userId: string, rideId: string, searchId: string): Promise<boolean> {
  const result = await db.query(
    `SELECT 1 FROM notifications
     WHERE user_id = $1
       AND data->>'type' = 'saved_search_match'
       AND data->>'rideId' = $2
       AND data->>'searchId' = $3
     LIMIT 1`,
    [userId, rideId, searchId]
  );
  return result.rows.length > 0;
}

/**
 * Уведомляет пользователей о поездке, подходящей под их сохранённые поиски
 */
export async function notifyMatchingSavedSearches(ride: RideForMatching): Promise<void> {
  try {
    const matches = await findMatchingSavedSearches(ride);
    if (matches.length === 0) return;

    const frontendUrl = process.env.FRONTEND_URL || 'https://ridetogether.ru';
    const rideUrl = `${frontendUrl}/ride/${ride.id}`;
    const time = ride.departure_time?.slice(0, 5) || '';

    for (const match of matches) {
      if (await wasAlreadyNotified(match.userId, ride.id, match.searchId)) continue;

      const route = `${ride.from_city} → ${ride.to_city}`;
      const title = '🔔 Новая поездка по вашему поиску';
      const message = match.searchName
        ? `«${match.searchName}»: ${route}\n📅 ${ride.departure_date} в ${time}\n💰 ${ride.price} ₽`
        : `${route}\n📅 ${ride.departure_date} в ${time}\n💰 ${ride.price} ₽`;

      await notificationService.send({
        userId: match.userId,
        title,
        message,
        channels: ['telegram', 'push'],
        url: rideUrl,
        data: { type: 'saved_search_match', rideId: ride.id, searchId: match.searchId },
      });
    }

    logger.info('Saved search notifications sent', { rideId: ride.id, count: matches.length });
  } catch (error) {
    logger.error('Error notifying saved searches', error as Error, { rideId: ride.id });
  }
}
