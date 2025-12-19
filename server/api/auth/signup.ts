/**
 * API endpoint для регистрации пользователя
 * Замена Supabase Auth.signUp()
 */

import { Request, Response } from 'express';
import { hash } from 'bcrypt';
import { generateToken, generateRefreshToken } from '../../utils/jwt.js';
import { db } from '../../utils/database.js';
import { createProfile } from '../../utils/profile.js';

export async function signUp(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, fullName } = req.body as { email?: string; password?: string; fullName?: string };

    // Валидация
    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'Email, password и fullName обязательны' });
      return;
    }

    // Проверка существующего пользователя
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: 'Пользователь с таким email уже существует' });
      return;
    }

    // Хеширование пароля
    const passwordHash = await hash(password, 10);

    // Создание пользователя
    const userResult = await db.query(
      `INSERT INTO users (email, password_hash, email_verified)
       VALUES ($1, $2, $3)
       RETURNING id, email, email_verified, created_at`,
      [email, passwordHash, false]
    );

    const user = userResult.rows[0];

    // Создание профиля
    await createProfile(user.id, fullName);

    // Генерация токенов
    const token = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Создание сессии
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 часа

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30); // 30 дней

    await db.query(
      `INSERT INTO sessions (user_id, token, refresh_token, expires_at, refresh_expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        user.id,
        token,
        refreshToken,
        expiresAt,
        refreshExpiresAt,
        req.headers['x-forwarded-for'] || req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      ]
    );

    // Получаем профиль
    const profileResult = await db.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [user.id]
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: {
          full_name: fullName,
        },
        created_at: user.created_at,
      },
      token,
      refresh_token: refreshToken,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Ошибка при регистрации' });
  }
}
