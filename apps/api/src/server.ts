import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import websocket from '@fastify/websocket';
import staticFiles from '@fastify/static';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { runMigrations } from './db/client.js';
import { boardRoutes } from './routes/boards.js';
import { cardRoutes } from './routes/cards.js';
import { noteRoutes } from './routes/notes.js';
import { connectionRoutes } from './routes/connections.js';
import { collabRoutes } from './routes/collab.js';
import { uploadRoutes } from './routes/upload.js';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

const TEN_MB = 10 * 1024 * 1024;

const app = Fastify({ logger: true, bodyLimit: TEN_MB });

// Plugins
await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
});

await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });
await app.register(websocket);

// Serve uploaded static files
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), 'data', 'uploads');
await mkdir(UPLOAD_DIR, { recursive: true });
await app.register(staticFiles, { root: UPLOAD_DIR, prefix: '/uploads/' });

// Health check
app.get('/health', async (_req, reply) => {
  return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register route modules under /api prefix
await app.register(async (api) => {
  await api.register(boardRoutes);
  await api.register(cardRoutes);
  await api.register(noteRoutes);
  await api.register(connectionRoutes);
  await api.register(uploadRoutes);
}, { prefix: '/api' });

// WebSocket collaboration rooms under /ws
await app.register(async (ws) => {
  await ws.register(collabRoutes);
}, { prefix: '/ws' });

// Run migrations before starting
runMigrations();
app.log.info('Database migrations applied');

try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`Server listening on http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
