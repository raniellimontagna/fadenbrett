import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import websocket from '@fastify/websocket';
import { runMigrations } from '../src/db/client.js';
import { boardRoutes } from '../src/routes/boards.js';
import { cardRoutes } from '../src/routes/cards.js';
import { noteRoutes } from '../src/routes/notes.js';
import { connectionRoutes } from '../src/routes/connections.js';

// Use in-memory DB for tests
process.env.DB_PATH = ':memory:';

async function buildApp() {
  const app = Fastify({ logger: false });
  await app.register(cors);
  await app.register(multipart);
  await app.register(websocket);

  app.get('/health', async (_req, reply) => reply.send({ status: 'ok' }));

  await app.register(async (api) => {
    await api.register(boardRoutes);
    await api.register(cardRoutes);
    await api.register(noteRoutes);
    await api.register(connectionRoutes);
  }, { prefix: '/api' });

  runMigrations();
  await app.ready();
  return app;
}

let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

describe('GET /health', () => {
  it('returns 200 with ok status', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok' });
  });
});

describe('Boards CRUD', () => {
  let boardId: string;

  it('POST /api/boards — creates a board', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/boards',
      payload: { name: 'Test Board' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.name).toBe('Test Board');
    boardId = body.id;
  });

  it('GET /api/boards — lists boards', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/boards' });
    expect(res.statusCode).toBe(200);
    expect(res.json().length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/boards/:id — returns board', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/boards/${boardId}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(boardId);
  });

  it('PATCH /api/boards/:id — renames board', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/boards/${boardId}`,
      payload: { name: 'Renamed Board' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe('Renamed Board');
  });

  it('POST /api/boards/:id/autosave — saves snapshot', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/boards/${boardId}/autosave`,
      payload: { nodes: [], edges: [] },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
  });

  it('GET /api/boards/:id/export — exports board', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/boards/${boardId}/export` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.schema_version).toBe(1);
    expect(body.board.id).toBe(boardId);
  });

  describe('Cards CRUD', () => {
    let cardId: string;

    it('POST /api/boards/:boardId/cards — creates card', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/boards/${boardId}/cards`,
        payload: { title: 'Walter White', eraLabel: 'Season 1', tags: ['chemist', 'teacher'] },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.title).toBe('Walter White');
      expect(body.tags).toContain('chemist');
      cardId = body.id;
    });

    it('GET /api/boards/:boardId/cards — lists cards', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/boards/${boardId}/cards` });
      expect(res.statusCode).toBe(200);
      expect(res.json().length).toBeGreaterThanOrEqual(1);
    });

    it('PATCH /api/boards/:boardId/cards/:id — updates card', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/boards/${boardId}/cards/${cardId}`,
        payload: { title: 'Heisenberg' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().title).toBe('Heisenberg');
    });

    it('DELETE /api/boards/:boardId/cards/:id — deletes card', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/boards/${boardId}/cards/${cardId}`,
      });
      expect(res.statusCode).toBe(204);
    });
  });

  describe('Notes CRUD', () => {
    let noteId: string;

    it('POST /api/boards/:boardId/notes — creates note', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/boards/${boardId}/notes`,
        payload: { content: 'I am the danger', color: '#fde68a' },
      });
      expect(res.statusCode).toBe(201);
      noteId = res.json().id;
    });

    it('PATCH /api/boards/:boardId/notes/:id — updates note', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/boards/${boardId}/notes/${noteId}`,
        payload: { content: 'I am the one who knocks' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().content).toBe('I am the one who knocks');
    });

    it('DELETE /api/boards/:boardId/notes/:id — deletes note', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/boards/${boardId}/notes/${noteId}`,
      });
      expect(res.statusCode).toBe(204);
    });
  });

  describe('Connections CRUD', () => {
    let connId: string;
    let src: string;
    let tgt: string;

    beforeAll(async () => {
      const r1 = await app.inject({
        method: 'POST',
        url: `/api/boards/${boardId}/cards`,
        payload: { title: 'Node A' },
      });
      const r2 = await app.inject({
        method: 'POST',
        url: `/api/boards/${boardId}/cards`,
        payload: { title: 'Node B' },
      });
      src = r1.json().id;
      tgt = r2.json().id;
    });

    it('POST /api/boards/:boardId/connections — creates connection', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/boards/${boardId}/connections`,
        payload: { sourceId: src, targetId: tgt, label: 'alliance', style: 'dashed' },
      });
      expect(res.statusCode).toBe(201);
      connId = res.json().id;
    });

    it('GET /api/boards/:boardId/connections — lists connections', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/boards/${boardId}/connections` });
      expect(res.statusCode).toBe(200);
      expect(res.json().length).toBeGreaterThanOrEqual(1);
    });

    it('PATCH /api/boards/:boardId/connections/:id — updates connection', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/boards/${boardId}/connections/${connId}`,
        payload: { label: 'rivalry' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().label).toBe('rivalry');
    });

    it('DELETE /api/boards/:boardId/connections/:id — deletes connection', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/boards/${boardId}/connections/${connId}`,
      });
      expect(res.statusCode).toBe(204);
    });
  });

  it('DELETE /api/boards/:id — deletes board', async () => {
    const res = await app.inject({ method: 'DELETE', url: `/api/boards/${boardId}` });
    expect(res.statusCode).toBe(204);
  });
});
