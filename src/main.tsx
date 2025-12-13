import { createRoot } from "react-dom/client";
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

createRoot(document.getElementById("root")!).render(<App />);
