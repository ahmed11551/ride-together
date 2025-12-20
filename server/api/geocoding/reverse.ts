/**
 * API endpoint для обратного геокодинга (координаты -> адрес)
 * GET /api/geocoding/reverse?lat=55.7558&lng=37.6173
 */

import { Request, Response } from 'express';
import { geocodingService } from '../../services/geocodingService.js';
import { logger } from '../../utils/logger.js';

export async function reverseGeocode(req: Request, res: Response): Promise<void> {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: 'Параметры lat и lng обязательны и должны быть числами' });
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({ error: 'Некорректные координаты' });
      return;
    }

    const address = await geocodingService.reverseGeocode(lat, lng);

    if (!address) {
      res.status(404).json({ error: 'Адрес не найден для данных координат' });
      return;
    }

    res.status(200).json({ address });
  } catch (error: any) {
    logger.error('Reverse geocoding error', error, { lat: req.query.lat, lng: req.query.lng });
    res.status(500).json({ error: 'Ошибка при обратном геокодинге' });
  }
}

