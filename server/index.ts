/**
 * Backend сервер для Ride Together
 * Замена Supabase Edge Functions и Auth
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { createWebSocketServer } from './websocket/server';
import { signUp } from './api/auth/signup';
import { signIn } from './api/auth/signin';
import { signOut } from './api/auth/signout';
import { getCurrentUser } from './api/auth/me';
import { listRides } from './api/rides/list';
import { getRide } from './api/rides/get';
import { createRide } from './api/rides/create';
import { updateRide } from './api/rides/update';
import { deleteRide } from './api/rides/delete';
import { getMyRides } from './api/rides/my';
import { listBookings } from './api/bookings/list';
import { createBooking } from './api/bookings/create';
import { updateBooking } from './api/bookings/update';
import { getRideBookings } from './api/bookings/ride';
import { listReviews } from './api/reviews/list';
import { createReview } from './api/reviews/create';
import { listMessages } from './api/messages/list';
import { createMessage } from './api/messages/create';
import { getProfile } from './api/profiles/get';
import { updateProfile } from './api/profiles/update';
import { banUser } from './api/profiles/ban';
import { listReports } from './api/reports/list';
import { createReport } from './api/reports/create';
import { updateReport } from './api/reports/update';

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
  const response = await signUp(req);
  res.status(response.status);
  res.json(await response.json());
});

app.post('/api/auth/signin', async (req, res) => {
  const response = await signIn(req);
  res.status(response.status);
  res.json(await response.json());
});

app.post('/api/auth/signout', async (req, res) => {
  const response = await signOut(req);
  res.status(response.status);
  res.json(await response.json());
});

app.get('/api/auth/me', async (req, res) => {
  const response = await getCurrentUser(req);
  res.status(response.status);
  res.json(await response.json());
});

// Rides routes
app.get('/api/rides', async (req, res) => {
  const response = await listRides(req);
  res.status(response.status);
  res.json(await response.json());
});

app.get('/api/rides/my', async (req, res) => {
  const response = await getMyRides(req);
  res.status(response.status);
  res.json(await response.json());
});

app.get('/api/rides/:id', async (req, res) => {
  const rideId = req.params.id;
  const response = await getRide(req, rideId);
  res.status(response.status);
  res.json(await response.json());
});

app.post('/api/rides', async (req, res) => {
  const response = await createRide(req);
  res.status(response.status);
  res.json(await response.json());
});

app.put('/api/rides/:id', async (req, res) => {
  const rideId = req.params.id;
  const response = await updateRide(req, rideId);
  res.status(response.status);
  res.json(await response.json());
});

app.delete('/api/rides/:id', async (req, res) => {
  const rideId = req.params.id;
  const response = await deleteRide(req, rideId);
  res.status(response.status);
  res.json(await response.json());
});

// Bookings routes
app.get('/api/bookings', async (req, res) => {
  const response = await listBookings(req);
  res.status(response.status);
  res.json(await response.json());
});

app.get('/api/bookings/ride/:rideId', async (req, res) => {
  const rideId = req.params.rideId;
  const response = await getRideBookings(req, rideId);
  res.status(response.status);
  res.json(await response.json());
});

app.post('/api/bookings', async (req, res) => {
  const response = await createBooking(req);
  res.status(response.status);
  res.json(await response.json());
});

app.put('/api/bookings/:id', async (req, res) => {
  const bookingId = req.params.id;
  const response = await updateBooking(req, bookingId);
  res.status(response.status);
  res.json(await response.json());
});

// Reviews routes
app.get('/api/reviews', async (req, res) => {
  const response = await listReviews(req);
  res.status(response.status);
  res.json(await response.json());
});

app.post('/api/reviews', async (req, res) => {
  const response = await createReview(req);
  res.status(response.status);
  res.json(await response.json());
});

// Messages routes
app.get('/api/messages/:rideId', async (req, res) => {
  const rideId = req.params.rideId;
  const response = await listMessages(req, rideId);
  res.status(response.status);
  res.json(await response.json());
});

app.post('/api/messages', async (req, res) => {
  const response = await createMessage(req);
  res.status(response.status);
  res.json(await response.json());
});

// Profiles routes
app.get('/api/profiles/me', async (req, res) => {
  const response = await getProfile(req);
  res.status(response.status);
  res.json(await response.json());
});

app.get('/api/profiles/:userId', async (req, res) => {
  const userId = req.params.userId;
  const response = await getProfile(req, userId);
  res.status(response.status);
  res.json(await response.json());
});

app.put('/api/profiles/me', async (req, res) => {
  const response = await updateProfile(req);
  res.status(response.status);
  res.json(await response.json());
});

app.put('/api/profiles/:userId/ban', async (req, res) => {
  const userId = req.params.userId;
  const response = await banUser(req, userId);
  res.status(response.status);
  res.json(await response.json());
});

// Reports routes
app.get('/api/reports', async (req, res) => {
  const response = await listReports(req);
  res.status(response.status);
  res.json(await response.json());
});

app.post('/api/reports', async (req, res) => {
  const response = await createReport(req);
  res.status(response.status);
  res.json(await response.json());
});

app.put('/api/reports/:id', async (req, res) => {
  const reportId = req.params.id;
  const response = await updateReport(req, reportId);
  res.status(response.status);
  res.json(await response.json());
});

// WebSocket server
const io = createWebSocketServer(httpServer);

// Export io for use in other modules (lazy export to avoid circular dependencies)
export { io };

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Слушаем на всех интерфейсах для Docker/Cloud

httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌍 CORS allowed origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : 'all (dev mode)'}`);
});
