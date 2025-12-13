/**
 * Утилиты для отправки push-уведомлений
 */

import { supabase } from '@/integrations/supabase/client';

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  requireInteraction?: boolean;
  data?: Record<string, any>;
}

/**
 * Отправка push-уведомления пользователю
 * 
 * Примечание: Для реальной отправки нужен сервер с web-push библиотекой
 * или Supabase Edge Function. Эта функция только сохраняет уведомление в БД.
 */
export async function sendPushNotification(
  payload: NotificationPayload
): Promise<boolean> {
  try {
    // Получаем подписку пользователя
    const { data: subscriptionData, error: subError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', payload.userId)
      .maybeSingle();

    if (subError || !subscriptionData) {
      console.warn('Подписка не найдена для пользователя:', payload.userId);
      return false;
    }

    // Здесь должна быть отправка через сервер/Edge Function
    // Пока просто логируем
    console.log('Уведомление для отправки:', {
      subscription: subscriptionData.subscription,
      payload,
    });

    // TODO: Вызвать Edge Function или внешний API для отправки
    // await fetch('/api/send-notification', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     subscription: subscriptionData.subscription,
    //     payload,
    //   }),
    // });

    return true;
  } catch (error) {
    console.error('Ошибка отправки уведомления:', error);
    return false;
  }
}

/**
 * Отправка уведомления о новом сообщении
 */
export async function notifyNewMessage(
  userId: string,
  rideId: string,
  senderName: string,
  messageContent: string
): Promise<boolean> {
  return sendPushNotification({
    userId,
    title: 'Новое сообщение',
    body: `${senderName}: ${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}`,
    url: `/ride/${rideId}`,
    tag: `message-${rideId}`,
    data: {
      type: 'message',
      rideId,
    },
  });
}

/**
 * Отправка уведомления о новом бронировании
 */
export async function notifyNewBooking(
  driverId: string,
  bookingId: string,
  passengerName: string,
  seats: number
): Promise<boolean> {
  return sendPushNotification({
    userId: driverId,
    title: 'Новое бронирование',
    body: `${passengerName} забронировал ${seats} ${seats === 1 ? 'место' : 'места'}`,
    url: '/my-rides',
    tag: `booking-${bookingId}`,
    data: {
      type: 'booking',
      bookingId,
    },
  });
}

/**
 * Отправка уведомления о подтверждении бронирования
 */
export async function notifyBookingConfirmed(
  passengerId: string,
  rideId: string,
  fromCity: string,
  toCity: string
): Promise<boolean> {
  return sendPushNotification({
    userId: passengerId,
    title: 'Бронирование подтверждено',
    body: `Ваша поездка ${fromCity} → ${toCity} подтверждена`,
    url: `/ride/${rideId}`,
    tag: `booking-confirmed-${rideId}`,
    data: {
      type: 'booking_confirmed',
      rideId,
    },
  });
}

/**
 * Отправка уведомления об отмене поездки
 */
export async function notifyRideCancelled(
  userId: string,
  rideId: string,
  fromCity: string,
  toCity: string
): Promise<boolean> {
  return sendPushNotification({
    userId,
    title: 'Поездка отменена',
    body: `Поездка ${fromCity} → ${toCity} была отменена`,
    url: '/my-bookings',
    tag: `ride-cancelled-${rideId}`,
    data: {
      type: 'ride_cancelled',
      rideId,
    },
  });
}

