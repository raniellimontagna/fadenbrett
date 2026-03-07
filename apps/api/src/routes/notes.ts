import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { notes } from '../db/schema/index.js';
import { CreateNoteSchema, UpdateNoteSchema } from '../schemas.js';

export async function noteRoutes(app: FastifyInstance): Promise<void> {
  // GET /boards/:boardId/notes
  app.get<{ Params: { boardId: string } }>('/boards/:boardId/notes', async (req, reply) => {
    const { boardId } = req.params;
    const rows = await db.select().from(notes).where(eq(notes.boardId, boardId)).all();
    return reply.send(rows);
  });

  // POST /boards/:boardId/notes
  app.post<{ Params: { boardId: string } }>('/boards/:boardId/notes', async (req, reply) => {
    const { boardId } = req.params;
    const result = CreateNoteSchema.safeParse(req.body);
    if (!result.success) return reply.status(400).send({ error: result.error.flatten() });

    const { id: rawId, ...data } = result.data;
    const id = rawId ?? crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(notes).values({ id, boardId, ...data, createdAt: now, updatedAt: now });
    const [row] = await db.select().from(notes).where(eq(notes.id, id));
    return reply.status(201).send(row);
  });

  // GET /boards/:boardId/notes/:id
  app.get<{ Params: { boardId: string; id: string } }>('/boards/:boardId/notes/:id', async (req, reply) => {
    const { boardId, id } = req.params;
    const [row] = await db.select().from(notes).where(and(eq(notes.id, id), eq(notes.boardId, boardId)));
    if (!row) return reply.status(404).send({ error: 'Note not found' });
    return reply.send(row);
  });

  // PATCH /boards/:boardId/notes/:id
  app.patch<{ Params: { boardId: string; id: string } }>('/boards/:boardId/notes/:id', async (req, reply) => {
    const { boardId, id } = req.params;
    const result = UpdateNoteSchema.safeParse(req.body);
    if (!result.success) return reply.status(400).send({ error: result.error.flatten() });

    const { id: _id, ...data } = result.data;
    await db
      .update(notes)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(and(eq(notes.id, id), eq(notes.boardId, boardId)));

    const [row] = await db.select().from(notes).where(eq(notes.id, id));
    if (!row) return reply.status(404).send({ error: 'Note not found' });
    return reply.send(row);
  });

  // DELETE /boards/:boardId/notes/:id
  app.delete<{ Params: { boardId: string; id: string } }>('/boards/:boardId/notes/:id', async (req, reply) => {
    const { boardId, id } = req.params;
    await db.delete(notes).where(and(eq(notes.id, id), eq(notes.boardId, boardId)));
    return reply.status(204).send();
  });
}
