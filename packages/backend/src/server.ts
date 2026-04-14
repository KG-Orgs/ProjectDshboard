import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createClient } from 'redis';
import { Queue } from 'bullmq';

// Routes
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = Number.parseInt(process.env.REDIS_PORT || '6379', 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;
const queuesEnabled = process.env.ENABLE_REDIS_QUEUES === 'true';

const bullConnection = {
  host: redisHost,
  port: redisPort,
  password: redisPassword,
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redis client for caching
const redisClient = createClient({
  url: `redis://${redisHost}:${redisPort}`,
  password: redisPassword,
  socket: {
    reconnectStrategy: false,
  },
});

redisClient.on('error', (error) => {
  console.warn('Redis client error:', error.message);
});

// Job queues for background tasks
const chatQueue = queuesEnabled
  ? new Queue('chat', { connection: bullConnection })
  : null;
const syncQueue = queuesEnabled
  ? new Queue('sync', { connection: bullConnection })
  : null;
const emailQueue = queuesEnabled
  ? new Queue('email', { connection: bullConnection })
  : null;

// Make queues available globally
app.locals.chatQueue = chatQueue;
app.locals.syncQueue = syncQueue;
app.locals.emailQueue = emailQueue;
app.locals.redisClient = redisClient;

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Error handling middleware
  app.use((err: unknown, _req: Request, res: Response) => {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
        message,
      code: 'INTERNAL_ERROR',
    },
  });
});

// Start server
const server = app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

void redisClient.connect().catch((error) => {
  console.warn('Redis unavailable, continuing without cache connection:', error.message);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  server.close(async () => {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }

    await Promise.all([
      chatQueue?.close(),
      syncQueue?.close(),
      emailQueue?.close(),
    ]);
    process.exit(0);
  });
});

export default app;
