import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupGlobalErrorHandlers } from "@/lib/error-handler-enhanced";

// Setup global error handlers
setupGlobalErrorHandlers();

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
    // Игнорируем ошибки от расширений
    if (event.data && typeof event.data === 'string' && event.data.includes('extension')) {
      return;
    }
    console.warn('Service Worker message error:', event);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
