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
      .then((registration) => {
        console.log('Service Worker registered:', registration);
        
        // Проверяем обновления Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Новый Service Worker доступен, можно обновить страницу
                console.log('New Service Worker available');
              }
            });
          }
        });
      })
      .catch((error) => {
        // Игнорируем ошибки от расширений браузера
        if (error.message && error.message.includes('Receiving end does not exist')) {
          return;
        }
        console.warn('Service Worker registration failed:', error);
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
      console.warn('Service Worker message error:', event);
    }
  });

  // Обработка ошибок Promise rejection от Service Worker
  window.addEventListener('unhandledrejection', (event) => {
    // Игнорируем ошибки от расширений браузера
    if (event.reason && typeof event.reason === 'object' && event.reason.message) {
      if (event.reason.message.includes('Receiving end does not exist')) {
        event.preventDefault(); // Предотвращаем вывод ошибки в консоль
        return;
      }
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
