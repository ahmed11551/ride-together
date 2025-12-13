// Service Worker for PWA and Push Notifications
const CACHE_NAME = 'ride-together-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Кэш открыт');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  // Не кэшируем API запросы и другие динамические ресурсы
  if (event.request.url.includes('/rest/v1/') || 
      event.request.url.includes('/auth/v1/') ||
      event.request.url.includes('/realtime/v1/') ||
      event.request.url.includes('/storage/v1/')) {
    return; // Пропускаем Service Worker для API запросов
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request).catch(() => {
          // Если сеть недоступна и нет кэша, возвращаем offline страницу
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  console.log('Push уведомление получено:', event);

  let notificationData = {
    title: 'RideConnect',
    body: 'У вас новое уведомление',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'ride-connect-notification',
    requireInteraction: false,
    data: {},
  };

  // Если данные пришли с сервера
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        requireInteraction: data.requireInteraction || false,
        data: data.data || {},
      };
    } catch (error) {
      console.error('Ошибка парсинга данных push:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: notificationData.data.actions || [],
      vibrate: [200, 100, 200],
    })
  );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('Клик по уведомлению:', event);

  event.notification.close();

  const data = event.notification.data || {};
  const url = data.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // Если окно уже открыто, фокусируемся на нем
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Иначе открываем новое окно
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Обработка закрытия уведомления
self.addEventListener('notificationclose', (event) => {
  console.log('Уведомление закрыто:', event);
});
