/**
 * API endpoint для геокодинга адреса
 * GET /api/geocoding/geocode?address=Москва, Красная площадь
 */

import { Request, Response } from 'express';
import { geocodingService } from '../../services/geocodingService.js';
import { logger } from '../../utils/logger.js';

export async function geocodeAddress(req: Request, res: Response): Promise<void> {
  try {
    const address = req.query.address as string;

    if (!address || address.trim().length === 0) {
      res.status(400).json({ error: 'Параметр address обязателен' });
      return;
    }

    const result = await geocodingService.geocode(address);

    if (!result) {
      res.status(404).json({ error: 'Адрес не найден' });
      return;
    }

    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Geocoding error', error, { address: req.query.address });
    res.status(500).json({ error: 'Ошибка при геокодинге адреса' });
  }
}

