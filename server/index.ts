/**
 * Backend сервер для Ride Together
 * Замена Supabase Edge Functions и Auth
 */

// Автоматическая загрузка переменных окружения
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Получаем __dirname для ES модулей (только если нужно)
let __dirname: string;
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = dirname(__filename);
} catch {
  // Fallback для случаев, когда import.meta.url недоступен
  __dirname = process.cwd();
}

// Загружаем .env файлы только если переменные не установлены через PM2/system
// Приоритет: переменные окружения (PM2) > .env.production > .env
// В production PM2 обычно устанавливает переменные через ecosystem.config.cjs
if (process.env.NODE_ENV !== 'production' || !process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  const envPath = process.env.NODE_ENV === 'production' 
    ? path.join(process.cwd(), '.env.production')
    : path.join(process.cwd(), '.env');
  // Загружаем с опцией override: false чтобы не перезаписывать существующие переменные
  dotenv.config({ path: envPath, override: false });
  dotenv.config({ override: false }); // Также загружаем .env если есть
}

// Установка значений по умолчанию для Timeweb (если не заданы)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://gen_user:fn)un5%40K2oLrBJ@9d497bc2bf9dd679bd9834af.twc1.net:5432/default_db?sslmode=verify-full';
}
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET не установлен! Используется временный ключ. Установите JWT_SECRET в production!');
  process.env.JWT_SECRET = 'temporary-secret-key-change-in-production-min-32-chars';
} else if (process.env.NODE_ENV === 'production') {
  console.log('✅ JWT_SECRET загружен из переменных окружения');
}
if (!process.env.PORT) {
  process.env.PORT = '3001';
}
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { createWebSocketServer } from './websocket/server.js';
import { signUp } from './api/auth/signup.js';
import { signIn } from './api/auth/signin.js';
import { signOut } from './api/auth/signout.js';
import { getCurrentUser } from './api/auth/me.js';
import { listRides } from './api/rides/list.js';
import { getRide } from './api/rides/get.js';
import { createRide } from './api/rides/create.js';
import { updateRide } from './api/rides/update.js';
import { deleteRide } from './api/rides/delete.js';
import { getMyRides } from './api/rides/my.js';
import { listBookings } from './api/bookings/list.js';
import { createBooking } from './api/bookings/create.js';
import { updateBooking } from './api/bookings/update.js';
import { getRideBookings } from './api/bookings/ride.js';
import { listReviews } from './api/reviews/list.js';
import { createReview } from './api/reviews/create.js';
import { listMessages } from './api/messages/list.js';
import { createMessage } from './api/messages/create.js';
import { getProfile } from './api/profiles/get.js';
import { updateProfile } from './api/profiles/update.js';
import { banUser } from './api/profiles/ban.js';
import { listReports } from './api/reports/list.js';
import { createReport } from './api/reports/create.js';
import { updateReport } from './api/reports/update.js';
import { listUsers } from './api/users/list.js';
import { subscribeToBot } from './api/telegram/subscribe.js';
import { unsubscribeFromBot } from './api/telegram/unsubscribe.js';
import { getSubscriptionStatus } from './api/telegram/status.js';
import { telegramWebhook } from './api/telegram/webhook.js';

const app = express();
const httpServer = createServer(app);

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];

// Функция проверки origin с поддержкой wildcard
const isOriginAllowed = (origin: string): boolean => {
  // Разрешаем локальные разработки
  if (process.env.NODE_ENV !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    return true;
  }
  
  // Разрешаем запросы с того же домена (если фронт и бэк на одном домене)
  if (origin && process.env.FRONTEND_URL && origin.startsWith(process.env.FRONTEND_URL)) {
    return true;
  }
  
  // Если нет ограничений, разрешаем все (только для dev)
  if (allowedOrigins.length === 0) {
    return process.env.NODE_ENV !== 'production';
  }
  
  // Проверяем точное совпадение
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Проверяем wildcard для vercel.app (например: *.vercel.app)
  for (const allowed of allowedOrigins) {
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(origin)) {
        return true;
      }
    }
  }
  
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (мобильные приложения, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  await signUp(req, res);
});

app.post('/api/auth/signin', async (req, res) => {
  await signIn(req, res);
});

app.post('/api/auth/signout', async (req, res) => {
  await signOut(req, res);
});

app.get('/api/auth/me', async (req, res) => {
  await getCurrentUser(req, res);
});

// Rides routes
app.get('/api/rides', async (req, res) => {
  await listRides(req, res);
});

app.get('/api/rides/my', async (req, res) => {
  await getMyRides(req, res);
});

app.get('/api/rides/:id', async (req, res) => {
  const rideId = req.params.id;
  await getRide(req, res, rideId);
});

app.post('/api/rides', async (req, res) => {
  await createRide(req, res);
});

app.put('/api/rides/:id', async (req, res) => {
  const rideId = req.params.id;
  await updateRide(req, res, rideId);
});

app.delete('/api/rides/:id', async (req, res) => {
  const rideId = req.params.id;
  await deleteRide(req, res, rideId);
});

// Bookings routes
app.get('/api/bookings', async (req, res) => {
  await listBookings(req, res);
});

app.get('/api/bookings/ride/:rideId', async (req, res) => {
  const rideId = req.params.rideId;
  await getRideBookings(req, res, rideId);
});

app.post('/api/bookings', async (req, res) => {
  await createBooking(req, res);
});

app.put('/api/bookings/:id', async (req, res) => {
  const bookingId = req.params.id;
  await updateBooking(req, res, bookingId);
});

// Reviews routes
app.get('/api/reviews', async (req, res) => {
  await listReviews(req, res);
});

app.post('/api/reviews', async (req, res) => {
  await createReview(req, res);
});

// Messages routes
app.get('/api/messages/:rideId', async (req, res) => {
  const rideId = req.params.rideId;
  await listMessages(req, res, rideId);
});

app.post('/api/messages', async (req, res) => {
  await createMessage(req, res);
});

// Profiles routes
app.get('/api/profiles/me', async (req, res) => {
  await getProfile(req, res);
});

app.get('/api/profiles/:userId', async (req, res) => {
  const userId = req.params.userId;
  await getProfile(req, res, userId);
});

app.put('/api/profiles/me', async (req, res) => {
  await updateProfile(req, res);
});

app.put('/api/profiles/:userId/ban', async (req, res) => {
  const userId = req.params.userId;
  await banUser(req, res, userId);
});

// Reports routes
app.get('/api/reports', async (req, res) => {
  await listReports(req, res);
});

app.post('/api/reports', async (req, res) => {
  await createReport(req, res);
});

app.put('/api/reports/:id', async (req, res) => {
  const reportId = req.params.id;
  await updateReport(req, res, reportId);
});

// Users routes (admin only)
app.get('/api/users', async (req, res) => {
  await listUsers(req, res);
});

// Telegram bot routes
app.post('/api/telegram/subscribe', async (req, res) => {
  await subscribeToBot(req, res);
});

app.post('/api/telegram/unsubscribe', async (req, res) => {
  await unsubscribeFromBot(req, res);
});

app.get('/api/telegram/status', async (req, res) => {
  await getSubscriptionStatus(req, res);
});

// Telegram webhook (для обработки обновлений от Telegram)
app.post('/api/telegram/webhook', async (req, res) => {
  await telegramWebhook(req, res);
});

// WebSocket server
const io = createWebSocketServer(httpServer);

// Export io for use in other modules (lazy export to avoid circular dependencies)
export { io };

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0'; // Слушаем на всех интерфейсах для Docker/Cloud

httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌍 CORS allowed origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : 'all (dev mode)'}`);
});
