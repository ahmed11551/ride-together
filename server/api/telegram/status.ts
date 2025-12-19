/**
 * API endpoint для проверки статуса подписки на Telegram бота
 * GET /api/telegram/status
 */

import { Request, Response } from 'express';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt.js';
import { db } from '../../utils/database.js';

export async function getSubscriptionStatus(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token || '');

    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    // Получаем подписку
    const subscriptionResult = await db.query(
      `SELECT s.*, bu.is_subscribed as bot_subscribed
       FROM subscriptions s
       LEFT JOIN bot_users bu ON bu.telegram_user_id = s.telegram_user_id
       WHERE s.user_id = $1`,
      [payload.userId]
    );

    if (subscriptionResult.rows.length === 0) {
      res.status(200).json({ 
        is_subscribed: false,
        subscription: null
      });
      return;
    }

    const subscription = subscriptionResult.rows[0];

    res.status(200).json({
      is_subscribed: subscription.subscription_status === 'active' && (subscription.bot_subscribed === true || subscription.bot_subscribed === null),
      subscription: {
        id: subscription.id,
        user_id: subscription.user_id,
        telegram_user_id: subscription.telegram_user_id,
        telegram_username: subscription.telegram_username,
        subscription_type: subscription.subscription_type,
        subscription_status: subscription.subscription_status,
        subscribed_at: subscription.subscribed_at,
        expires_at: subscription.expires_at,
      }
    });
  } catch (error: any) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Ошибка при получении статуса подписки' });
  }
}

