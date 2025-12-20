/**
 * Расширенный API endpoint для поиска поездок с фильтрами
 * GET /api/rides/search
 */

import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { Request, Response } from 'express';
import { logger } from '../../utils/logger.js';

export interface SearchFilters {
  from?: string;
  to?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  timeFrom?: string;
  timeTo?: string;
  passengers?: number;
  minPrice?: number;
  maxPrice?: number;
  allowSmoking?: boolean;
  allowPets?: boolean;
  allowMusic?: boolean;
  minRating?: number;
  sortBy?: 'departure' | 'price_asc' | 'price_desc' | 'rating' | 'recent';
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
}

export async function searchRides(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const userId = token ? verifyToken(token)?.userId : null;

    // Парсим фильтры из query параметров
    const filters: SearchFilters = {
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      date: req.query.date as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      timeFrom: req.query.timeFrom as string | undefined,
      timeTo: req.query.timeTo as string | undefined,
      passengers: req.query.passengers ? parseInt(req.query.passengers as string) : undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      allowSmoking: req.query.allowSmoking === 'true' ? true : req.query.allowSmoking === 'false' ? false : undefined,
      allowPets: req.query.allowPets === 'true' ? true : req.query.allowPets === 'false' ? false : undefined,
      allowMusic: req.query.allowMusic === 'true' ? true : req.query.allowMusic === 'false' ? false : undefined,
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      sortBy: (req.query.sortBy as SearchFilters['sortBy']) || 'departure',
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    // Обработка пагинации
    const limit = filters.pageSize || filters.limit || 50;
    const offset = filters.page && filters.pageSize
      ? (filters.page - 1) * filters.pageSize
      : filters.offset || 0;
    const includePagination = !!(filters.page && filters.pageSize);

    // Базовый запрос для подсчета
    let countQuery = `
      SELECT COUNT(*) as total
      FROM rides r
      LEFT JOIN profiles p ON r.driver_id = p.user_id
      WHERE r.status = 'active'
    `;
    const countParams: any[] = [];

    // Базовый запрос для данных
    let query = `
      SELECT 
        r.*,
        p.full_name as driver_full_name,
        p.avatar_url as driver_avatar_url,
        p.rating as driver_rating,
        p.trips_count as driver_trips_count,
        p.is_verified as driver_is_verified
      FROM rides r
      LEFT JOIN profiles p ON r.driver_id = p.user_id
      WHERE r.status = 'active'
    `;
    const params: any[] = [];

    // Применяем фильтры
    let paramIndex = 1;

    // Фильтр по городу отправления
    if (filters.from) {
      params.push(`%${filters.from}%`);
      query += ` AND (r.from_city ILIKE $${paramIndex} OR r.from_address ILIKE $${paramIndex})`;
      countParams.push(`%${filters.from}%`);
      countQuery += ` AND (r.from_city ILIKE $${countParams.length} OR r.from_address ILIKE $${countParams.length})`;
      paramIndex++;
    }

    // Фильтр по городу назначения
    if (filters.to) {
      params.push(`%${filters.to}%`);
      query += ` AND (r.to_city ILIKE $${paramIndex} OR r.to_address ILIKE $${paramIndex})`;
      countParams.push(`%${filters.to}%`);
      countQuery += ` AND (r.to_city ILIKE $${countParams.length} OR r.to_address ILIKE $${countParams.length})`;
      paramIndex++;
    }

    // Фильтр по дате (точная дата)
    if (filters.date) {
      params.push(filters.date);
      query += ` AND r.departure_date = $${paramIndex}`;
      countParams.push(filters.date);
      countQuery += ` AND r.departure_date = $${countParams.length}`;
      paramIndex++;
    } else {
      // Диапазон дат
      if (filters.dateFrom) {
        params.push(filters.dateFrom);
        query += ` AND r.departure_date >= $${paramIndex}`;
        countParams.push(filters.dateFrom);
        countQuery += ` AND r.departure_date >= $${countParams.length}`;
        paramIndex++;
      }
      if (filters.dateTo) {
        params.push(filters.dateTo);
        query += ` AND r.departure_date <= $${paramIndex}`;
        countParams.push(filters.dateTo);
        countQuery += ` AND r.departure_date <= $${countParams.length}`;
        paramIndex++;
      }
    }

    // Фильтр по времени отправления
    if (filters.timeFrom) {
      params.push(filters.timeFrom);
      query += ` AND r.departure_time >= $${paramIndex}`;
      countParams.push(filters.timeFrom);
      countQuery += ` AND r.departure_time >= $${countParams.length}`;
      paramIndex++;
    }
    if (filters.timeTo) {
      params.push(filters.timeTo);
      query += ` AND r.departure_time <= $${paramIndex}`;
      countParams.push(filters.timeTo);
      countQuery += ` AND r.departure_time <= $${countParams.length}`;
      paramIndex++;
    }

    // Фильтр по количеству пассажиров
    if (filters.passengers && filters.passengers > 0) {
      params.push(filters.passengers);
      query += ` AND r.seats_available >= $${paramIndex}`;
      countParams.push(filters.passengers);
      countQuery += ` AND r.seats_available >= $${countParams.length}`;
      paramIndex++;
    }

    // Фильтр по цене
    if (filters.minPrice !== undefined) {
      params.push(filters.minPrice);
      query += ` AND r.price >= $${paramIndex}`;
      countParams.push(filters.minPrice);
      countQuery += ` AND r.price >= $${countParams.length}`;
      paramIndex++;
    }
    if (filters.maxPrice !== undefined) {
      params.push(filters.maxPrice);
      query += ` AND r.price <= $${paramIndex}`;
      countParams.push(filters.maxPrice);
      countQuery += ` AND r.price <= $${countParams.length}`;
      paramIndex++;
    }

    // Фильтры по предпочтениям
    if (filters.allowSmoking !== undefined) {
      params.push(filters.allowSmoking);
      query += ` AND r.allow_smoking = $${paramIndex}`;
      countParams.push(filters.allowSmoking);
      countQuery += ` AND r.allow_smoking = $${countParams.length}`;
      paramIndex++;
    }
    if (filters.allowPets !== undefined) {
      params.push(filters.allowPets);
      query += ` AND r.allow_pets = $${paramIndex}`;
      countParams.push(filters.allowPets);
      countQuery += ` AND r.allow_pets = $${countParams.length}`;
      paramIndex++;
    }
    if (filters.allowMusic !== undefined) {
      params.push(filters.allowMusic);
      query += ` AND r.allow_music = $${paramIndex}`;
      countParams.push(filters.allowMusic);
      countQuery += ` AND r.allow_music = $${countParams.length}`;
      paramIndex++;
    }

    // Фильтр по рейтингу водителя
    if (filters.minRating !== undefined) {
      params.push(filters.minRating);
      query += ` AND COALESCE(p.rating, 5.0) >= $${paramIndex}`;
      countParams.push(filters.minRating);
      countQuery += ` AND COALESCE(p.rating, 5.0) >= $${countParams.length}`;
      paramIndex++;
    }

    // Сортировка
    switch (filters.sortBy) {
      case 'price_asc':
        query += ' ORDER BY r.price ASC, r.departure_date ASC';
        break;
      case 'price_desc':
        query += ' ORDER BY r.price DESC, r.departure_date ASC';
        break;
      case 'rating':
        query += ' ORDER BY COALESCE(p.rating, 5.0) DESC, r.departure_date ASC';
        break;
      case 'recent':
        query += ' ORDER BY r.created_at DESC';
        break;
      case 'departure':
      default:
        query += ' ORDER BY r.departure_date ASC, r.departure_time ASC';
        break;
    }

    // Лимит и оффсет
    params.push(limit, offset);
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    // Выполняем запросы
    const [countResult, dataResult] = await Promise.all([
      includePagination ? db.query(countQuery, countParams) : Promise.resolve({ rows: [{ total: 0 }] }),
      db.query(query, params),
    ]);

    const total = includePagination ? parseInt(countResult.rows[0].total) : 0;
    const totalPages = includePagination && filters.pageSize ? Math.ceil(total / filters.pageSize) : 0;

    const rides = dataResult.rows.map(row => ({
      id: row.id,
      driver_id: row.driver_id,
      from_city: row.from_city,
      from_address: row.from_address,
      to_city: row.to_city,
      to_address: row.to_address,
      departure_date: row.departure_date,
      departure_time: row.departure_time,
      estimated_duration: row.estimated_duration,
      price: parseFloat(row.price),
      seats_total: row.seats_total,
      seats_available: row.seats_available,
      status: row.status,
      allow_smoking: row.allow_smoking,
      allow_pets: row.allow_pets,
      allow_music: row.allow_music,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      driver: row.driver_full_name ? {
        full_name: row.driver_full_name,
        avatar_url: row.driver_avatar_url,
        rating: parseFloat(row.driver_rating || '5.0'),
        trips_count: row.driver_trips_count || 0,
        is_verified: row.driver_is_verified || false,
      } : undefined,
    }));

    // Возвращаем результат с пагинацией
    if (includePagination) {
      const currentPage = filters.page || 1;
      const currentPageSize = filters.pageSize || limit;
      res.status(200).json({
        data: rides,
        total,
        page: currentPage,
        pageSize: currentPageSize,
        totalPages,
        hasMore: currentPage < totalPages,
        filters: filters,
      });
      return;
    }

    // Иначе просто массив
    res.status(200).json(rides);
  } catch (error: any) {
    logger.error('Search rides error', error, { userId: (req as any).userId });
    res.status(500).json({ error: 'Ошибка при поиске поездок' });
  }
}

