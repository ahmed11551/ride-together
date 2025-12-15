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

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
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

// WebSocket server
const io = createWebSocketServer(httpServer);

// Export io for use in other modules
export { io };

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
});
