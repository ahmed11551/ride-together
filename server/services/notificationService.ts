/**
 * Централизованный сервис уведомлений
 * Координирует отправку уведомлений через разные каналы
 */

import { emailService } from './emailService.js';
import { logger } from '../utils/logger.js';
import { db } from '../utils/database.js';

export type NotificationChannel = 'email' | 'push' | 'telegram' | 'sms';

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  telegram: boolean;
  sms: boolean;
}

interface SendNotificationOptions {
  userId: string;
  title: string;
  message: string;
  channels?: NotificationChannel[];
  data?: Record<string, unknown>;
  url?: string;
}

class NotificationService {
  /**
   * Получение предпочтений пользователя для уведомлений
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const result = await db.query(
        `SELECT 
          COALESCE(email_notifications, true) as email,
          COALESCE(push_notifications, true) as push,
          COALESCE(telegram_notifications, false) as telegram,
          COALESCE(sms_notifications, false) as sms
        FROM profiles
        WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        // Возвращаем настройки по умолчанию
        return {
          email: true,
          push: true,
          telegram: false,
          sms: false,
        };
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching user notification preferences', error as Error, { userId });
      // Возвращаем настройки по умолчанию при ошибке
      return {
        email: true,
        push: true,
        telegram: false,
        sms: false,
      };
    }
  }

  /**
   * Получение email пользователя
   */
  private async getUserEmail(userId: string): Promise<string | null> {
    try {
      const result = await db.query(
        'SELECT email FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0]?.email || null;
    } catch (error) {
      logger.error('Error fetching user email', error as Error, { userId });
      return null;
    }
  }

  /**
   * Отправка уведомления
   */
  async send(options: SendNotificationOptions): Promise<void> {
    const { userId, title, message, channels, data, url } = options;

    // Получаем предпочтения пользователя
    const preferences = await this.getUserPreferences(userId);
    const channelsToUse = channels || this.getDefaultChannels(preferences);

    // Отправляем через каждый канал
    const promises: Promise<void>[] = [];

    if (channelsToUse.includes('email') && preferences.email) {
      promises.push(this.sendEmail(userId, title, message, data, url));
    }

    if (channelsToUse.includes('push') && preferences.push) {
      promises.push(this.sendPush(userId, title, message, data, url));
    }

    if (channelsToUse.includes('telegram') && preferences.telegram) {
      promises.push(this.sendTelegram(userId, title, message, data, url));
    }

    // Выполняем параллельно, но не ждём все успешные
    await Promise.allSettled(promises);
  }

  /**
   * Определение каналов по умолчанию на основе предпочтений
   */
  private getDefaultChannels(preferences: NotificationPreferences): NotificationChannel[] {
    const channels: NotificationChannel[] = [];
    if (preferences.email) channels.push('email');
    if (preferences.push) channels.push('push');
    if (preferences.telegram) channels.push('telegram');
    return channels;
  }

  /**
   * Отправка email уведомления
   */
  private async sendEmail(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, unknown>,
    url?: string
  ): Promise<void> {
    try {
      const email = await this.getUserEmail(userId);
      if (!email) {
        logger.warn('User email not found for notification', undefined, { userId });
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #0d9488; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .button { display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Ride Together</h1>
              </div>
              <div class="content">
                <h2>${title}</h2>
                <p>${message.replace(/\n/g, '<br>')}</p>
                ${url ? `<a href="${url}" class="button">Открыть в приложении</a>` : ''}
              </div>
            </div>
          </body>
        </html>
      `;

      await emailService.send({
        to: email,
        subject: title,
        html,
      });

      logger.info('Email notification sent', { userId, email, title });
    } catch (error) {
      logger.error('Error sending email notification', error as Error, { userId, title });
    }
  }

  /**
   * Отправка push уведомления
   * TODO: Реализовать через Service Worker и Web Push API
   */
  private async sendPush(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, unknown>,
    url?: string
  ): Promise<void> {
    // Сохраняем уведомление в БД для отправки через Service Worker
    try {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, data, url, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [userId, title, message, data ? JSON.stringify(data) : null, url || null]
      );
      logger.info('Push notification saved', { userId, title });
    } catch (error) {
      logger.error('Error saving push notification', error as Error, { userId, title });
    }
  }

  /**
   * Отправка Telegram уведомления
   */
  private async sendTelegram(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, unknown>,
    url?: string
  ): Promise<void> {
    try {
      // Получаем telegram_user_id из profiles или subscriptions
      const result = await db.query(
        `SELECT telegram_user_id FROM profiles WHERE user_id = $1 AND telegram_user_id IS NOT NULL
         UNION
         SELECT telegram_user_id FROM subscriptions WHERE user_id = $1 AND telegram_user_id IS NOT NULL
         LIMIT 1`,
        [userId]
      );

      const telegramUserId = result.rows[0]?.telegram_user_id;
      if (!telegramUserId) {
        logger.debug('User has no Telegram ID', { userId });
        return;
      }

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        logger.warn('TELEGRAM_BOT_TOKEN not configured');
        return;
      }

      const text = `${title}\n\n${message}${url ? `\n\n${url}` : ''}`;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramUserId,
          text,
          parse_mode: 'HTML',
        }),
      });

      logger.info('Telegram notification sent', { userId, telegramUserId, title });
    } catch (error) {
      logger.error('Error sending Telegram notification', error as Error, { userId, title });
    }
  }

  /**
   * Уведомление о новом бронировании для водителя
   */
  async notifyDriverAboutBooking(
    driverId: string,
    passengerName: string,
    rideId: string,
    rideFrom: string,
    rideTo: string,
    rideDate: string
  ): Promise<void> {
    await this.send({
      userId: driverId,
      title: 'Новое бронирование',
      message: `${passengerName} забронировал место в вашей поездке ${rideFrom} → ${rideTo} на ${rideDate}`,
      channels: ['email', 'push', 'telegram'],
      url: `https://ridetogether.ru/ride/${rideId}`,
      data: { type: 'booking', rideId },
    });
  }

  /**
   * Подтверждение бронирования для пассажира
   */
  async confirmBookingToPassenger(
    passengerId: string,
    driverName: string,
    rideId: string,
    rideFrom: string,
    rideTo: string,
    rideDate: string,
    rideTime: string
  ): Promise<void> {
    await this.send({
      userId: passengerId,
      title: 'Бронирование подтверждено',
      message: `Ваше бронирование на поездку ${rideFrom} → ${rideTo} с водителем ${driverName} подтверждено. Дата: ${rideDate}, время: ${rideTime}`,
      channels: ['email', 'push', 'telegram'],
      url: `https://ridetogether.ru/ride/${rideId}`,
      data: { type: 'booking_confirmed', rideId },
    });
  }

  /**
   * Напоминание о поездке
   */
  async sendRideReminder(
    userId: string,
    userName: string,
    rideId: string,
    rideFrom: string,
    rideTo: string,
    rideDate: string,
    rideTime: string,
    isDriver: boolean
  ): Promise<void> {
    const role = isDriver ? 'Вы водитель' : 'Вы пассажир';
    await this.send({
      userId,
      title: 'Напоминание о поездке',
      message: `${role}. Напоминаем о поездке ${rideFrom} → ${rideTo} завтра в ${rideTime}`,
      channels: ['email', 'push', 'telegram'],
      url: `https://ridetogether.ru/ride/${rideId}`,
      data: { type: 'reminder', rideId },
    });
  }
}

export const notificationService = new NotificationService();

