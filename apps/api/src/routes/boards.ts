import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { boards, cards, notes, connections } from '../db/schema/index.js';
import { CreateBoardSchema, UpdateBoardSchema } from '../schemas.js';

export async function boardRoutes(app: FastifyInstance): Promise<void> {
  // GET /boards — list all boards
  app.get('/boards', async (_req, reply) => {
    const rows = await db.select().from(boards).all();
    return reply.send(rows);
  });

  // POST /boards — create board
  app.post('/boards', async (req, reply) => {
    const result = CreateBoardSchema.safeParse(req.body);
    if (!result.success) {
      return reply.status(400).send({ error: result.error.flatten() });
    }
    const { id, name, description, color } = result.data;
    const boardId = id ?? crypto.randomUUID();
    const now = new Date().toISOString();
    await db.insert(boards).values({ id: boardId, name, description, color, createdAt: now, updatedAt: now });
    const [row] = await db.select().from(boards).where(eq(boards.id, boardId));
    return reply.status(201).send(row);
  });

  // GET /boards/:id — get board + all its entities
  app.get<{ Params: { id: string } }>('/boards/:id', async (req, reply) => {
    const { id } = req.params;
    const [board] = await db.select().from(boards).where(eq(boards.id, id));
    if (!board) return reply.status(404).send({ error: 'Board not found' });

    const [boardCards, boardNotes, boardConnections] = await Promise.all([
      db.select().from(cards).where(eq(cards.boardId, id)).all(),
      db.select().from(notes).where(eq(notes.boardId, id)).all(),
      db.select().from(connections).where(eq(connections.boardId, id)).all(),
    ]);

    return reply.send({ ...board, cards: boardCards, notes: boardNotes, connections: boardConnections });
  });

  // PATCH /boards/:id — rename board
  app.patch<{ Params: { id: string } }>('/boards/:id', async (req, reply) => {
    const { id } = req.params;
    const result = UpdateBoardSchema.safeParse(req.body);
    if (!result.success) return reply.status(400).send({ error: result.error.flatten() });

    await db.update(boards)
      .set({ ...result.data, updatedAt: new Date().toISOString() })
      .where(eq(boards.id, id));
    const [row] = await db.select().from(boards).where(eq(boards.id, id));
    if (!row) return reply.status(404).send({ error: 'Board not found' });
    return reply.send(row);
  });

  // DELETE /boards/:id
  app.delete<{ Params: { id: string } }>('/boards/:id', async (req, reply) => {
    const { id } = req.params;
    await db.delete(boards).where(eq(boards.id, id));
    return reply.status(204).send();
  });

  // POST /boards/:id/autosave — store full JSON snapshot
  app.post<{ Params: { id: string } }>('/boards/:id/autosave', async (req, reply) => {
    const { id } = req.params;
    const now = new Date().toISOString();
    const snapshot = JSON.stringify(req.body);
    const [board] = await db.select().from(boards).where(eq(boards.id, id));
    if (!board) {
      // Auto-create board if not exists
      await db.insert(boards).values({ id, name: 'Board', snapshot, createdAt: now, updatedAt: now });
    } else {
      await db.update(boards).set({ snapshot, updatedAt: now }).where(eq(boards.id, id));
    }
    return reply.send({ ok: true, savedAt: now });
  });

  // GET /boards/:id/export — export board JSON snapshot
  app.get<{ Params: { id: string } }>('/boards/:id/export', async (req, reply) => {
    const { id } = req.params;
    const [board] = await db.select().from(boards).where(eq(boards.id, id));
    if (!board) return reply.status(404).send({ error: 'Board not found' });

    const [boardCards, boardNotes, boardConnections] = await Promise.all([
      db.select().from(cards).where(eq(cards.boardId, id)).all(),
      db.select().from(notes).where(eq(notes.boardId, id)).all(),
      db.select().from(connections).where(eq(connections.boardId, id)).all(),
    ]);

    const payload = {
      schema_version: 1,
      exportedAt: new Date().toISOString(),
      board: { ...board },
      cards: boardCards,
      notes: boardNotes,
      connections: boardConnections,
    };

    reply.header('Content-Disposition', `attachment; filename="fadenbrett-${id}.json"`);
    return reply.send(payload);
  });
}
