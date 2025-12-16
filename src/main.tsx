// КРИТИЧНО: React должен быть импортирован первым и синхронно
// В продакшене используем глобальный React из CDN, если он доступен
let React: typeof import("react");
let createRoot: typeof import("react-dom/client").createRoot;

if (import.meta.env.PROD && typeof window !== 'undefined' && window.React) {
  // Используем глобальный React из CDN в продакшене
  React = window.React as any;
  const ReactDOM = window.ReactDOM as any;
  createRoot = ReactDOM.createRoot;
} else {
  // В dev режиме используем локальный React
  React = await import("react");
  const reactDom = await import("react-dom/client");
  createRoot = reactDom.createRoot;
}

import App from "./App.tsx";
import "./index.css";
import { setupGlobalErrorHandlers } from "@/lib/error-handler-enhanced";
import { initSentry } from "@/lib/sentry";

// Setup global error handlers first (lightweight)
setupGlobalErrorHandlers();

// Initialize Sentry asynchronously to not block initial render
if (import.meta.env.PROD) {
  // Delay Sentry initialization to not block initial load
  setTimeout(() => {
    initSentry();
  }, 100);
}

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(async (registration) => {
        const { logger } = await import('./lib/logger');
        logger.debug('Service Worker registered', { registration });
        
        // Проверяем обновления Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', async () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Новый Service Worker доступен, можно обновить страницу
                const { logger } = await import('./lib/logger');
                logger.debug('New Service Worker available');
              }
            });
          }
        });
      })
      .catch(async (error) => {
        // Игнорируем ошибки от расширений браузера
        if (error.message && error.message.includes('Receiving end does not exist')) {
          return;
        }
        const { logger } = await import('./lib/logger');
        logger.warn('Service Worker registration failed', error);
      });
  });
  
  // Обработка ошибок сообщений от Service Worker
  navigator.serviceWorker.addEventListener('messageerror', (event) => {
    // Игнорируем ошибки от расширений браузера
    if (event.data && typeof event.data === 'string' && event.data.includes('extension')) {
      return;
    }
    // Игнорируем ошибку "Receiving end does not exist" - это нормально для расширений
    if (event.error && event.error.message && event.error.message.includes('Receiving end does not exist')) {
      return;
    }
    // Логируем только реальные ошибки
    if (import.meta.env.DEV) {
      import('./lib/logger').then(({ logger }) => {
        logger.warn('Service Worker message error', event);
      });
    }
  });

  // Обработка ошибок Promise rejection от Service Worker
  window.addEventListener('unhandledrejection', (event) => {
    // Игнорируем ошибки от расширений браузера
    if (event.reason) {
      const errorMessage = typeof event.reason === 'object' && event.reason.message 
        ? event.reason.message 
        : String(event.reason);
      
      if (errorMessage.includes('Receiving end does not exist') || 
          errorMessage.includes('Extension context invalidated')) {
        event.preventDefault(); // Предотвращаем вывод ошибки в консоль
        return;
      }
    }
  });

  // Обработка ошибок от Service Worker в консоли
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('Receiving end does not exist') || 
        message.includes('Extension context invalidated')) {
      return; // Игнорируем эти ошибки
    }
    originalConsoleError.apply(console, args);
  };
}

// КРИТИЧНО: В продакшене ждем загрузки React из CDN перед рендерингом
if (import.meta.env.PROD && typeof window !== 'undefined') {
  // Проверяем, что React загружен
  const checkReact = () => {
    if (window.React && window.ReactDOM) {
      const React = window.React;
      const ReactDOM = window.ReactDOM;
      const root = ReactDOM.createRoot(document.getElementById("root")!);
      root.render(React.createElement(App));
    } else {
      // Если React еще не загружен, ждем немного и проверяем снова
      setTimeout(checkReact, 10);
    }
  };
  checkReact();
} else {
  // В dev режиме используем обычный импорт
  const { createRoot } = await import("react-dom/client");
  // КРИТИЧНО: В продакшене ждем загрузки React из CDN перед рендерингом
if (import.meta.env.PROD && typeof window !== 'undefined') {
  // Проверяем, что React загружен из CDN
  const initApp = () => {
    if (window.React && window.ReactDOM) {
      // Используем глобальный React из CDN
      const ReactGlobal = window.React;
      const ReactDOMGlobal = window.ReactDOM;
      const root = ReactDOMGlobal.createRoot(document.getElementById("root")!);
      root.render(ReactGlobal.createElement(App));
    } else {
      // Если React еще не загружен, ждем немного и проверяем снова
      setTimeout(initApp, 10);
    }
  };
  initApp();
} else {
  // В dev режиме используем обычный импорт
  createRoot(document.getElementById("root")!).render(<App />);
}
}
