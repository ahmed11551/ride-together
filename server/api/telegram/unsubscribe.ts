/**
 * API endpoint для отписки от Telegram бота
 * POST /api/telegram/unsubscribe
 */

import { Request, Response } from 'express';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { db } from '../../utils/database.js';

export async function unsubscribeFromBot(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    // Обновляем статус подписки
    await db.query(
      `UPDATE subscriptions 
       SET subscription_status = 'cancelled', updated_at = NOW()
       WHERE user_id = $1`,
      [payload.userId]
    );

    // Обновляем bot_users
    const subscription = await db.query(
      'SELECT telegram_user_id FROM subscriptions WHERE user_id = $1',
      [payload.userId]
    );

    if (subscription.rows.length > 0 && subscription.rows[0].telegram_user_id) {
      await db.query(
        `UPDATE bot_users 
         SET is_subscribed = false 
         WHERE telegram_user_id = $1`,
        [subscription.rows[0].telegram_user_id]
      );
    }

    res.status(200).json({ 
      success: true,
      message: 'Подписка отменена' 
    });
  } catch (error: any) {
    console.error('Unsubscribe from bot error:', error);
    res.status(500).json({ error: 'Ошибка при отписке от бота' });
  }
}

