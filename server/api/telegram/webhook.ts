/**
 * API endpoint для обработки webhook от Telegram
 * POST /api/telegram/webhook
 * 
 * Этот endpoint обрабатывает обновления от Telegram Bot API
 */

import { Request, Response } from 'express';
import { db } from '../../utils/database.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    date: number;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
      };
    };
    data?: string;
  };
}

async function sendTelegramMessage(chatId: number, text: string, options?: any): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not set');
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options,
    }),
  });
}

async function handleStartCommand(chatId: number, userId: number, username?: string, firstName?: string): Promise<void> {
  // Сохраняем пользователя в БД
  await db.query(
    `INSERT INTO bot_users (telegram_user_id, telegram_username, telegram_first_name, is_subscribed, last_interaction_at)
     VALUES ($1, $2, $3, true, NOW())
     ON CONFLICT (telegram_user_id) 
     DO UPDATE SET 
       telegram_username = EXCLUDED.telegram_username,
       telegram_first_name = EXCLUDED.telegram_first_name,
       is_subscribed = true,
       last_interaction_at = NOW()`,
    [userId, username || null, firstName || null]
  );

  const welcomeMessage = `🚗 Добро пожаловать в Ride Together!

Я помогу вам найти попутчиков или стать водителем.

📱 <b>Что я умею:</b>
• Найти поездку
• Создать поездку
• Управлять бронированиями
• Получать уведомления
• Поддержка и помощь
• Оставить отзыв

🎁 <b>Сейчас все бесплатно!</b>
Подпишитесь на бота, чтобы получать:
• Уведомления о новых поездках
• Напоминания о бронированиях
• Специальные предложения

Используйте меню ниже для навигации:`;

  await sendTelegramMessage(chatId, welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🚀 Открыть приложение',
            web_app: { url: process.env.FRONTEND_URL || 'https://ridetogether.ru' },
          },
        ],
        [
          { text: '📊 Мои поездки', callback_data: 'my_rides' },
          { text: '🔍 Найти поездку', callback_data: 'search_rides' },
        ],
        [
          { text: '💬 Поддержка', callback_data: 'support' },
          { text: '⭐ Отзывы', callback_data: 'reviews' },
        ],
      ],
    },
  });
}

async function handleCallbackQuery(callbackQuery: TelegramUpdate['callback_query'], chatId: number): Promise<void> {
  if (!callbackQuery?.data) return;

  const data = callbackQuery.data;
  const userId = callbackQuery.from.id;

  // Отвечаем на callback
  if (TELEGRAM_BOT_TOKEN) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQuery.id,
      }),
    });
  }

  switch (data) {
    case 'my_rides':
      await sendTelegramMessage(chatId, '📊 Откройте приложение, чтобы посмотреть ваши поездки:', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Открыть приложение',
                web_app: { url: `${process.env.FRONTEND_URL || 'https://ridetogether.ru'}/my-rides` },
              },
            ],
          ],
        },
      });
      break;

    case 'search_rides':
      await sendTelegramMessage(chatId, '🔍 Откройте приложение, чтобы найти поездку:', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Открыть приложение',
                web_app: { url: `${process.env.FRONTEND_URL || 'https://ridetogether.ru'}/search` },
              },
            ],
          ],
        },
      });
      break;

    case 'support':
      await sendTelegramMessage(chatId, '💬 По вопросам поддержки напишите нам или создайте тикет в приложении.');
      break;

    case 'reviews':
      await sendTelegramMessage(chatId, '⭐ Оставить отзыв можно в приложении в разделе профиля.');
      break;

    default:
      await sendTelegramMessage(chatId, 'Используйте команды из меню.');
  }
}

export async function telegramWebhook(req: Request, res: Response): Promise<void> {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not configured' });
      return;
    }

    const update: TelegramUpdate = req.body;

    // Обрабатываем callback query
    if (update.callback_query) {
      const chatId = update.callback_query.message?.chat.id;
      if (chatId) {
        await handleCallbackQuery(update.callback_query, chatId);
      }
      res.status(200).json({ ok: true });
      return;
    }

    // Обрабатываем сообщения
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const userId = message.from.id;
      const text = message.text;

      // Обновляем информацию о пользователе
      await db.query(
        `INSERT INTO bot_users (telegram_user_id, telegram_username, telegram_first_name, telegram_last_name, is_subscribed, last_interaction_at)
         VALUES ($1, $2, $3, $4, true, NOW())
         ON CONFLICT (telegram_user_id) 
         DO UPDATE SET 
           telegram_username = EXCLUDED.telegram_username,
           telegram_first_name = EXCLUDED.telegram_first_name,
           telegram_last_name = EXCLUDED.telegram_last_name,
           last_interaction_at = NOW()`,
        [
          userId,
          message.from.username || null,
          message.from.first_name || null,
          message.from.last_name || null,
        ]
      );

      // Обрабатываем команды
      if (text) {
        if (text.startsWith('/start')) {
          await handleStartCommand(chatId, userId, message.from.username, message.from.first_name);
        } else if (text.startsWith('/help')) {
          await sendTelegramMessage(chatId, 'Помощь:\n\nИспользуйте кнопки меню или команды:\n/start - Главное меню\n/help - Эта справка');
        } else {
          await sendTelegramMessage(chatId, 'Используйте команду /start для начала работы.');
        }
      }

      res.status(200).json({ ok: true });
      return;
    }

    // Если обновление не обработано, просто отвечаем OK
    res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

