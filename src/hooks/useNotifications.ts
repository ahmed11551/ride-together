import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { env } from '@/lib/env';
import { apiClient } from '@/lib/api-client';

export interface NotificationPermission {
  permission: NotificationPermissionState;
  isSupported: boolean;
}

/**
 * Hook для работы с push-уведомлениями
 */
export const useNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Проверяем поддержку уведомлений
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  /**
   * Запрос разрешения на уведомления
   */
  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      const { logger } = await import('@/lib/logger');
      logger.warn('Браузер не поддерживает уведомления');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      const { logger } = await import('@/lib/logger');
      logger.warn('Разрешение на уведомления отклонено');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      const { logger } = await import('@/lib/logger');
      logger.error('Ошибка при запросе разрешения', error);
      return false;
    }
  };

  /**
   * Регистрация Service Worker для push-уведомлений
   */
  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
      const { logger } = await import('@/lib/logger');
      logger.warn('Service Worker не поддерживается');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const { logger } = await import('@/lib/logger');
      logger.debug('Service Worker зарегистрирован', registration);
      return registration;
    } catch (error) {
      const { logger } = await import('@/lib/logger');
      logger.error('Ошибка регистрации Service Worker', error);
      return null;
    }
  };

  /**
   * Подписка на push-уведомления
   */
  const subscribeToPush = async (): Promise<PushSubscription | null> => {
    if (!user) {
      const { logger } = await import('@/lib/logger');
      logger.warn('Пользователь не авторизован');
      return null;
    }

    const registration = await registerServiceWorker();
    if (!registration) {
      return null;
    }

    try {
      // Проверяем, есть ли уже подписка
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        await saveSubscription(existingSubscription, user.id);
        return existingSubscription;
      }

      // VAPID ключ опционален - если нет, создаем подписку без него
      const vapidKey = env.VITE_VAPID_PUBLIC_KEY;
      const subscribeOptions: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
      };

      if (vapidKey) {
        subscribeOptions.applicationServerKey = urlBase64ToUint8Array(vapidKey);
      }

      const subscription = await registration.pushManager.subscribe(subscribeOptions);

      // Сохраняем подписку через API (нужно создать endpoint)
      await saveSubscription(subscription, user.id);

      return subscription;
    } catch (error) {
      const { logger } = await import('@/lib/logger');
      logger.error('Ошибка подписки на push', error);
      return null;
    }
  };

  /**
   * Отписка от push-уведомлений
   */
  const unsubscribeFromPush = async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await removeSubscription(user.id);
        return true;
      }

      return false;
    } catch (error) {
      const { logger } = await import('@/lib/logger');
      logger.error('Ошибка отписки от push', error);
      return false;
    }
  };

  /**
   * Инициализация уведомлений (запрос разрешения + подписка)
   */
  const initializeNotifications = async (): Promise<boolean> => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      return false;
    }

    const subscription = await subscribeToPush();
    return subscription !== null;
  };

  return {
    permission,
    isSupported,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    initializeNotifications,
    registerServiceWorker,
  };
};

/**
 * Сохранение подписки через API
 */
async function saveSubscription(
  subscription: PushSubscription,
  userId: string
): Promise<void> {
  try {
    // TODO: Создать API endpoint для сохранения подписок
    // Пока просто логируем
    const { logger } = await import('@/lib/logger');
    logger.debug('Subscription saved', { userId, endpoint: subscription.endpoint });
    
    // В будущем: await apiClient.post('/api/push-subscriptions', { ... });
  } catch (error) {
    const { logger } = await import('@/lib/logger');
    logger.error('Ошибка сохранения подписки', error);
  }
}

/**
 * Удаление подписки через API
 */
async function removeSubscription(userId: string): Promise<void> {
  try {
    // TODO: Создать API endpoint для удаления подписок
    const { logger } = await import('@/lib/logger');
    logger.debug('Subscription removed', { userId });
    
    // В будущем: await apiClient.delete(`/api/push-subscriptions/${userId}`);
  } catch (error) {
    const { logger } = await import('@/lib/logger');
    logger.error('Ошибка удаления подписки', error);
  }
}

/**
 * Конвертация VAPID ключа из base64 в Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
