/**
 * Сервис для сбора статистики и аналитики
 */

import { db } from '../utils/database.js';
import { logger } from '../utils/logger.js';

export interface PlatformStats {
  totalUsers: number;
  totalRides: number;
  activeRides: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  popularRoutes: Array<{ from: string; to: string; count: number }>;
}

class StatsService {
  /**
   * Получение общей статистики платформы
   */
  async getPlatformStats(): Promise<PlatformStats> {
    try {
      const [
        usersResult,
        ridesResult,
        activeRidesResult,
        bookingsResult,
        revenueResult,
        ratingResult,
        routesResult,
      ] = await Promise.all([
        db.query('SELECT COUNT(*) as count FROM users'),
        db.query('SELECT COUNT(*) as count FROM rides'),
        db.query("SELECT COUNT(*) as count FROM rides WHERE status = 'active'"),
        db.query('SELECT COUNT(*) as count FROM bookings'),
        db.query(
          `SELECT COALESCE(SUM(total_price), 0) as total 
           FROM bookings 
           WHERE payment_status = 'paid'`
        ),
        db.query(
          `SELECT COALESCE(AVG(rating), 0) as avg 
           FROM reviews 
           WHERE rating IS NOT NULL`
        ),
        db.query(
          `SELECT from_city, to_city, COUNT(*) as count
           FROM rides
           WHERE status = 'active'
           GROUP BY from_city, to_city
           ORDER BY count DESC
           LIMIT 10`
        ),
      ]);

      return {
        totalUsers: parseInt(usersResult.rows[0].count),
        totalRides: parseInt(ridesResult.rows[0].count),
        activeRides: parseInt(activeRidesResult.rows[0].count),
        totalBookings: parseInt(bookingsResult.rows[0].count),
        totalRevenue: parseFloat(revenueResult.rows[0].total || '0'),
        averageRating: parseFloat(ratingResult.rows[0].avg || '0'),
        popularRoutes: routesResult.rows.map((row) => ({
          from: row.from_city,
          to: row.to_city,
          count: parseInt(row.count),
        })),
      };
    } catch (error) {
      logger.error('Error getting platform stats', error as Error);
      throw error;
    }
  }

  /**
   * Статистика пользователя
   */
  async getUserStats(userId: string): Promise<{
    ridesCreated: number;
    ridesCompleted: number;
    bookingsMade: number;
    totalSpent: number;
    averageRating: number;
  }> {
    try {
      const [
        createdResult,
        completedResult,
        bookingsResult,
        spentResult,
        ratingResult,
      ] = await Promise.all([
        db.query('SELECT COUNT(*) as count FROM rides WHERE driver_id = $1', [userId]),
        db.query(
          "SELECT COUNT(*) as count FROM rides WHERE driver_id = $1 AND status = 'completed'",
          [userId]
        ),
        db.query('SELECT COUNT(*) as count FROM bookings WHERE passenger_id = $1', [userId]),
        db.query(
          `SELECT COALESCE(SUM(total_price), 0) as total 
           FROM bookings 
           WHERE passenger_id = $1 AND payment_status = 'paid'`,
          [userId]
        ),
        db.query(
          `SELECT COALESCE(AVG(rating), 0) as avg 
           FROM reviews 
           WHERE reviewed_id = $1 AND rating IS NOT NULL`,
          [userId]
        ),
      ]);

      return {
        ridesCreated: parseInt(createdResult.rows[0].count),
        ridesCompleted: parseInt(completedResult.rows[0].count),
        bookingsMade: parseInt(bookingsResult.rows[0].count),
        totalSpent: parseFloat(spentResult.rows[0].total || '0'),
        averageRating: parseFloat(ratingResult.rows[0].avg || '0'),
      };
    } catch (error) {
      logger.error('Error getting user stats', error as Error, { userId });
      throw error;
    }
  }
}

export const statsService = new StatsService();

