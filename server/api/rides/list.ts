/**
 * API endpoint для получения списка поездок
 * GET /api/rides
 */

import { db } from '../../utils/database.js';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { Request, Response } from 'express';


export async function listRides(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const userId = token ? verifyToken(token)?.userId : null;

    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const date = req.query.date as string | undefined;
    const passengers = parseInt((req.query.passengers as string) || '1');
    const status = (req.query.status as string) || 'active';
    
    // Поддержка пагинации: page/pageSize или limit/offset
    const page = parseInt((req.query.page as string) || '0');
    const pageSize = parseInt((req.query.pageSize as string) || '0');
    const limit = pageSize > 0 ? pageSize : parseInt((req.query.limit as string) || '50');
    const offset = page > 0 && pageSize > 0 
      ? (page - 1) * pageSize 
      : parseInt((req.query.offset as string) || '0');
    
    // Флаг для возврата метаданных пагинации
    const includePagination = req.query.includePagination === 'true' || 
                               (page > 0 && pageSize > 0);

    // Базовый запрос для подсчета общего количества
    let countQuery = `
      SELECT COUNT(*) as total
      FROM rides r
      WHERE r.status = $1
        AND r.seats_available >= $2
    `;
    const countParams: any[] = [status, passengers];

    // Фильтры для подсчета
    if (from) {
      countParams.push(`%${from}%`);
      countQuery += ` AND r.from_city ILIKE $${countParams.length}`;
    }
    if (to) {
      countParams.push(`%${to}%`);
      countQuery += ` AND r.to_city ILIKE $${countParams.length}`;
    }
    if (date) {
      countParams.push(date);
      countQuery += ` AND r.departure_date = $${countParams.length}`;
    }

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
      WHERE r.status = $1
        AND r.seats_available >= $2
    `;
    const params: any[] = [status, passengers];

    // Фильтры
    if (from) {
      params.push(`%${from}%`);
      query += ` AND r.from_city ILIKE $${params.length}`;
    }
    if (to) {
      params.push(`%${to}%`);
      query += ` AND r.to_city ILIKE $${params.length}`;
    }
    if (date) {
      params.push(date);
      query += ` AND r.departure_date = $${params.length}`;
    }

    // Сортировка
    // Для recent rides сортируем по created_at DESC, для search - по departure_date ASC
    const sortBy = (req.query.sortBy as string) || 'departure';
    if (sortBy === 'recent' || sortBy === 'created_at') {
      query += ` ORDER BY r.created_at DESC`;
    } else {
      query += ` ORDER BY r.departure_date ASC, r.departure_time ASC`;
    }

    // Лимит и оффсет
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    // Выполняем запросы
    const [countResult, dataResult] = await Promise.all([
      includePagination ? db.query(countQuery, countParams) : Promise.resolve({ rows: [{ total: 0 }] }),
      db.query(query, params)
    ]);

    const total = includePagination ? parseInt(countResult.rows[0].total) : 0;
    const totalPages = includePagination && pageSize > 0 ? Math.ceil(total / pageSize) : 0;

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

    // Если запрошена пагинация, возвращаем объект с метаданными
    if (includePagination) {
      const currentPage = page > 0 ? page : 1;
      const currentPageSize = pageSize > 0 ? pageSize : limit;
      res.status(200).json({
        data: rides,
        total,
        page: currentPage,
        pageSize: currentPageSize,
        totalPages,
        hasMore: currentPage < totalPages,
      });
      return;
    }

    // Иначе возвращаем просто массив (обратная совместимость)
    res.status(200).json(rides);
  } catch (error: any) {
    console.error('List rides error:', error);
    res.status(500).json({ error: 'Ошибка при получении списка поездок' });
  }
}

