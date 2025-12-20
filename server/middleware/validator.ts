/**
 * Middleware для валидации данных
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Валидация email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Валидация пароля (минимум 8 символов, хотя бы одна буква и одна цифра)
 */
export function validatePassword(password: string): boolean {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
}

/**
 * Sanitize строки - удаляет потенциально опасные символы
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '') // Удаляем < и >
    .trim()
    .substring(0, 10000); // Максимальная длина
}

/**
 * Валидация UUID
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Middleware для валидации регистрации
 */
export function validateSignup(req: Request, res: Response, next: NextFunction): void {
  const { email, password, fullName } = req.body;

  if (!email || !validateEmail(email)) {
    res.status(400).json({ error: 'Некорректный email адрес' });
    return;
  }

  if (!password || !validatePassword(password)) {
    res.status(400).json({ 
      error: 'Пароль должен содержать минимум 8 символов, включая буквы и цифры' 
    });
    return;
  }

  if (!fullName || fullName.trim().length < 2) {
    res.status(400).json({ error: 'Имя должно содержать минимум 2 символа' });
    return;
  }

  // Sanitize данные
  req.body.email = email.toLowerCase().trim();
  req.body.fullName = sanitizeString(fullName);

  next();
}

/**
 * Middleware для валидации входа
 */
export function validateSignin(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body;

  if (!email || !validateEmail(email)) {
    res.status(400).json({ error: 'Некорректный email адрес' });
    return;
  }

  if (!password || password.length < 1) {
    res.status(400).json({ error: 'Пароль обязателен' });
    return;
  }

  req.body.email = email.toLowerCase().trim();

  next();
}

/**
 * Middleware для валидации создания поездки
 */
export function validateCreateRide(req: Request, res: Response, next: NextFunction): void {
  const { from_city, to_city, departure_date, departure_time, price, seats_total } = req.body;

  if (!from_city || typeof from_city !== 'string' || from_city.trim().length < 2) {
    res.status(400).json({ error: 'Город отправления обязателен' });
    return;
  }

  if (!to_city || typeof to_city !== 'string' || to_city.trim().length < 2) {
    res.status(400).json({ error: 'Город назначения обязателен' });
    return;
  }

  if (!departure_date || !/^\d{4}-\d{2}-\d{2}$/.test(departure_date)) {
    res.status(400).json({ error: 'Дата отправления должна быть в формате YYYY-MM-DD' });
    return;
  }

  if (!departure_time || !/^\d{2}:\d{2}$/.test(departure_time)) {
    res.status(400).json({ error: 'Время отправления должно быть в формате HH:MM' });
    return;
  }

  if (typeof price !== 'number' || price < 0 || price > 100000) {
    res.status(400).json({ error: 'Цена должна быть числом от 0 до 100000' });
    return;
  }

  if (typeof seats_total !== 'number' || seats_total < 1 || seats_total > 8) {
    res.status(400).json({ error: 'Количество мест должно быть от 1 до 8' });
    return;
  }

  // Sanitize строковые поля
  req.body.from_city = sanitizeString(from_city);
  req.body.to_city = sanitizeString(to_city);
  if (req.body.from_address) req.body.from_address = sanitizeString(req.body.from_address);
  if (req.body.to_address) req.body.to_address = sanitizeString(req.body.to_address);
  if (req.body.notes) req.body.notes = sanitizeString(req.body.notes);

  next();
}

/**
 * Middleware для валидации UUID параметров
 */
export function validateUUIDParam(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];
    if (!id || !validateUUID(id)) {
      res.status(400).json({ error: `Некорректный формат ${paramName}` });
      return;
    }
    next();
  };
}

