/**
 * API endpoint для подписки на Telegram бота
 * POST /api/telegram/subscribe
 */

import { Request, Response } from 'express';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { db } from '../../utils/database.js';

export async function subscribeToBot(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const { telegram_user_id, telegram_username, telegram_first_name, telegram_last_name } = req.body as {
      telegram_user_id?: number;
      telegram_username?: string;
      telegram_first_name?: string;
      telegram_last_name?: string;
    };

    if (!telegram_user_id) {
      res.status(400).json({ error: 'telegram_user_id обязателен' });
      return;
    }

    // Создаем или обновляем запись в bot_users
    await db.query(
      `INSERT INTO bot_users (telegram_user_id, telegram_username, telegram_first_name, telegram_last_name, is_subscribed, last_interaction_at)
       VALUES ($1, $2, $3, $4, true, NOW())
       ON CONFLICT (telegram_user_id) 
       DO UPDATE SET 
         telegram_username = EXCLUDED.telegram_username,
         telegram_first_name = EXCLUDED.telegram_first_name,
         telegram_last_name = EXCLUDED.telegram_last_name,
         is_subscribed = true,
         last_interaction_at = NOW()`,
      [telegram_user_id, telegram_username || null, telegram_first_name || null, telegram_last_name || null]
    );

    // Создаем или обновляем подписку
    // Проверяем существующую подписку
    const existingSub = await db.query(
      'SELECT id FROM subscriptions WHERE user_id = $1 OR telegram_user_id = $2',
      [payload.userId, telegram_user_id]
    );

    if (existingSub.rows.length > 0) {
      // Обновляем существующую
      await db.query(
        `UPDATE subscriptions SET 
         telegram_user_id = $1,
         telegram_username = $2,
         telegram_first_name = $3,
         telegram_last_name = $4,
         subscription_status = 'active',
         updated_at = NOW()
         WHERE user_id = $5 OR telegram_user_id = $1`,
        [telegram_user_id, telegram_username || null, telegram_first_name || null, telegram_last_name || null, payload.userId]
      );
    } else {
      // Создаем новую
      await db.query(
        `INSERT INTO subscriptions (user_id, telegram_user_id, telegram_username, telegram_first_name, telegram_last_name, subscription_type, subscription_status, subscribed_at)
         VALUES ($1, $2, $3, $4, $5, 'free', 'active', NOW())`,
        [payload.userId, telegram_user_id, telegram_username || null, telegram_first_name || null, telegram_last_name || null]
      );
    }

    res.status(200).json({ 
      success: true,
      message: 'Подписка активирована' 
    });
  } catch (error: any) {
    console.error('Subscribe to bot error:', error);
    res.status(500).json({ error: 'Ошибка при подписке на бота' });
  }
}

