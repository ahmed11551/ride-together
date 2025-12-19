/**
 * API endpoint для входа пользователя
 * Замена Supabase Auth.signInWithPassword()
 */

import { Request, Response } from 'express';
import { compare } from 'bcrypt';
import { generateToken, generateRefreshToken } from '../../utils/jwt.js';
import { db } from '../../utils/database.js';

export async function signIn(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    // Валидация
    if (!email || !password) {
      res.status(400).json({ error: 'Email и password обязательны' });
      return;
    }

    // Поиск пользователя
    const userResult = await db.query(
      'SELECT id, email, password_hash, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({ error: 'Неверный email или password' });
      return;
    }

    const user = userResult.rows[0];

    // Проверка пароля
    const passwordMatch = await compare(password, user.password_hash);

    if (!passwordMatch) {
      res.status(401).json({ error: 'Неверный email или password' });
      return;
    }

    // Генерация токенов
    const token = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Создание сессии
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 часа

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30); // 30 дней

    await db.query(
      `INSERT INTO sessions (user_id, token, refresh_token, expires_at, refresh_expires_at, ip_address, user_agent, last_used_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (token) DO UPDATE SET last_used_at = NOW()`,
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

    // Получаем профиль для user_metadata
    const profileResult = await db.query(
      'SELECT full_name FROM profiles WHERE user_id = $1',
      [user.id]
    );

    const profile = profileResult.rows[0];

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: {
          full_name: profile?.full_name || null,
        },
        email_verified: user.email_verified,
      },
      token,
      refresh_token: refreshToken,
    });
  } catch (error: any) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Ошибка при входе' });
  }
}
