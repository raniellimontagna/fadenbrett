import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { connections } from '../db/schema/index.js';
import { CreateConnectionSchema, UpdateConnectionSchema } from '../schemas.js';

export async function connectionRoutes(app: FastifyInstance): Promise<void> {
  // GET /boards/:boardId/connections
  app.get<{ Params: { boardId: string } }>('/boards/:boardId/connections', async (req, reply) => {
    const { boardId } = req.params;
    const rows = await db.select().from(connections).where(eq(connections.boardId, boardId)).all();
    return reply.send(rows);
  });

  // POST /boards/:boardId/connections
  app.post<{ Params: { boardId: string } }>('/boards/:boardId/connections', async (req, reply) => {
    const { boardId } = req.params;
    const result = CreateConnectionSchema.safeParse(req.body);
    if (!result.success) return reply.status(400).send({ error: result.error.flatten() });

    const { id: rawId, ...data } = result.data;
    const id = rawId ?? crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(connections).values({ id, boardId, ...data, createdAt: now, updatedAt: now });
    const [row] = await db.select().from(connections).where(eq(connections.id, id));
    return reply.status(201).send(row);
  });

  // GET /boards/:boardId/connections/:id
  app.get<{ Params: { boardId: string; id: string } }>('/boards/:boardId/connections/:id', async (req, reply) => {
    const { boardId, id } = req.params;
    const [row] = await db
      .select()
      .from(connections)
      .where(and(eq(connections.id, id), eq(connections.boardId, boardId)));
    if (!row) return reply.status(404).send({ error: 'Connection not found' });
    return reply.send(row);
  });

  // PATCH /boards/:boardId/connections/:id
  app.patch<{ Params: { boardId: string; id: string } }>('/boards/:boardId/connections/:id', async (req, reply) => {
    const { boardId, id } = req.params;
    const result = UpdateConnectionSchema.safeParse(req.body);
    if (!result.success) return reply.status(400).send({ error: result.error.flatten() });

    const { id: _id, ...data } = result.data;
    await db
      .update(connections)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(and(eq(connections.id, id), eq(connections.boardId, boardId)));

    const [row] = await db.select().from(connections).where(eq(connections.id, id));
    if (!row) return reply.status(404).send({ error: 'Connection not found' });
    return reply.send(row);
  });

  // DELETE /boards/:boardId/connections/:id
  app.delete<{ Params: { boardId: string; id: string } }>('/boards/:boardId/connections/:id', async (req, reply) => {
    const { boardId, id } = req.params;
    await db.delete(connections).where(and(eq(connections.id, id), eq(connections.boardId, boardId)));
    return reply.status(204).send();
  });
}
