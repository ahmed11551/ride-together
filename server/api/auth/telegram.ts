/**
 * Авторизация через Telegram Mini App
 * POST /api/auth/telegram
 */

import crypto from 'crypto';
import { hash } from 'bcrypt';
import { Request, Response } from 'express';
import { db } from '../../utils/database.js';
import { generateToken, generateRefreshToken } from '../../utils/jwt.js';
import { createProfile } from '../../utils/profile.js';

interface TelegramUserPayload {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

function validateTelegramInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get('hash');
  if (!receivedHash) return false;

  params.delete('hash');
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return calculatedHash === receivedHash;
}

async function createSession(req: Request, userId: string, email: string) {
  const token = generateToken(userId, email);
  const refreshToken = generateRefreshToken(userId, email);

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);

  await db.query(
    `INSERT INTO sessions (user_id, token, refresh_token, expires_at, refresh_expires_at, ip_address, user_agent, last_used_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      userId,
      token,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
      req.headers['x-forwarded-for'] || req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown',
    ]
  );

  return { token, refreshToken };
}

export async function telegramAuth(req: Request, res: Response): Promise<void> {
  try {
    const { init_data, user: telegramUser } = req.body as {
      init_data?: string;
      user?: TelegramUserPayload;
    };

    if (!telegramUser?.id || !telegramUser.first_name) {
      res.status(400).json({ error: 'Данные Telegram пользователя обязательны' });
      return;
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken && init_data && !validateTelegramInitData(init_data, botToken)) {
      res.status(401).json({ error: 'Неверная подпись Telegram' });
      return;
    }

    const telegramId = telegramUser.id.toString();
    const fullName = `${telegramUser.first_name}${telegramUser.last_name ? ` ${telegramUser.last_name}` : ''}`.trim();

    const existingProfile = await db.query(
      'SELECT user_id, full_name FROM profiles WHERE telegram_id = $1',
      [telegramId]
    );

    if (existingProfile.rows.length > 0) {
      const userId = existingProfile.rows[0].user_id;

      await db.query(
        `UPDATE profiles SET
          telegram_username = $1,
          telegram_first_name = $2,
          telegram_last_name = $3,
          telegram_photo_url = $4,
          avatar_url = COALESCE($4, avatar_url),
          updated_at = NOW()
         WHERE user_id = $5`,
        [
          telegramUser.username || null,
          telegramUser.first_name,
          telegramUser.last_name || null,
          telegramUser.photo_url || null,
          userId,
        ]
      );

      const userResult = await db.query('SELECT id, email FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        res.status(500).json({ error: 'Пользователь не найден' });
        return;
      }

      const user = userResult.rows[0];
      const { token, refreshToken } = await createSession(req, user.id, user.email);

      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          user_metadata: { full_name: existingProfile.rows[0].full_name || fullName },
        },
        token,
        refresh_token: refreshToken,
        is_new_user: false,
      });
      return;
    }

    const telegramEmail = `telegram_${telegramId}@telegram.local`;
    const passwordHash = await hash(crypto.randomUUID(), 10);

    const userResult = await db.query(
      `INSERT INTO users (email, password_hash, email_verified)
       VALUES ($1, $2, true)
       RETURNING id, email, created_at`,
      [telegramEmail, passwordHash]
    );

    const user = userResult.rows[0];
    await createProfile(user.id, fullName);

    await db.query(
      `UPDATE profiles SET
        telegram_id = $1,
        telegram_username = $2,
        telegram_first_name = $3,
        telegram_last_name = $4,
        telegram_photo_url = $5,
        avatar_url = $5
       WHERE user_id = $6`,
      [
        telegramId,
        telegramUser.username || null,
        telegramUser.first_name,
        telegramUser.last_name || null,
        telegramUser.photo_url || null,
        user.id,
      ]
    );

    const { token, refreshToken } = await createSession(req, user.id, user.email);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: { full_name: fullName },
        created_at: user.created_at,
      },
      token,
      refresh_token: refreshToken,
      is_new_user: true,
    });
  } catch (error) {
    console.error('Telegram auth error:', error);
    res.status(500).json({ error: 'Ошибка авторизации через Telegram' });
  }
}
