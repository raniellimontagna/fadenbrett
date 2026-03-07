import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { cards, tags, cardTags } from '../db/schema/index.js';
import { CreateCardSchema, UpdateCardSchema } from '../schemas.js';

async function upsertTags(tagNames: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of tagNames) {
    const existing = await db.select().from(tags).where(eq(tags.name, name)).get();
    if (existing) {
      ids.push(existing.id);
    } else {
      const id = crypto.randomUUID();
      await db.insert(tags).values({ id, name });
      ids.push(id);
    }
  }
  return ids;
}

async function getCardTags(cardId: string): Promise<string[]> {
  const rows = await db
    .select({ name: tags.name })
    .from(cardTags)
    .innerJoin(tags, eq(cardTags.tagId, tags.id))
    .where(eq(cardTags.cardId, cardId))
    .all();
  return rows.map((r) => r.name);
}

export async function cardRoutes(app: FastifyInstance): Promise<void> {
  // GET /boards/:boardId/cards
  app.get<{ Params: { boardId: string } }>('/boards/:boardId/cards', async (req, reply) => {
    const { boardId } = req.params;
    const rows = await db.select().from(cards).where(eq(cards.boardId, boardId)).all();
    const withTags = await Promise.all(rows.map(async (c) => ({ ...c, tags: await getCardTags(c.id) })));
    return reply.send(withTags);
  });

  // POST /boards/:boardId/cards
  app.post<{ Params: { boardId: string } }>('/boards/:boardId/cards', async (req, reply) => {
    const { boardId } = req.params;
    const result = CreateCardSchema.safeParse(req.body);
    if (!result.success) return reply.status(400).send({ error: result.error.flatten() });

    const { tags: tagNames, id: rawId, ...data } = result.data;
    const id = rawId ?? crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(cards).values({
      id,
      boardId,
      title: data.title,
      description: data.description,
      avatar: data.avatar,
      eraLabel: data.eraLabel,
      groupColor: data.groupColor,
      imageUrl: data.imageUrl,
      positionX: data.positionX,
      positionY: data.positionY,
      createdAt: now,
      updatedAt: now,
    });

    if (tagNames.length > 0) {
      const tagIds = await upsertTags(tagNames);
      await db.insert(cardTags).values(tagIds.map((tagId) => ({ cardId: id, tagId })));
    }

    const [row] = await db.select().from(cards).where(eq(cards.id, id));
    return reply.status(201).send({ ...row, tags: tagNames });
  });

  // GET /boards/:boardId/cards/:id
  app.get<{ Params: { boardId: string; id: string } }>('/boards/:boardId/cards/:id', async (req, reply) => {
    const { boardId, id } = req.params;
    const [row] = await db.select().from(cards).where(and(eq(cards.id, id), eq(cards.boardId, boardId)));
    if (!row) return reply.status(404).send({ error: 'Card not found' });
    return reply.send({ ...row, tags: await getCardTags(id) });
  });

  // PATCH /boards/:boardId/cards/:id
  app.patch<{ Params: { boardId: string; id: string } }>('/boards/:boardId/cards/:id', async (req, reply) => {
    const { boardId, id } = req.params;
    const result = UpdateCardSchema.safeParse(req.body);
    if (!result.success) return reply.status(400).send({ error: result.error.flatten() });

    const { tags: tagNames, ...data } = result.data;
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = { updatedAt: now };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.eraLabel !== undefined) updateData.eraLabel = data.eraLabel;
    if (data.groupColor !== undefined) updateData.groupColor = data.groupColor;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.positionX !== undefined) updateData.positionX = data.positionX;
    if (data.positionY !== undefined) updateData.positionY = data.positionY;

    await db.update(cards).set(updateData).where(and(eq(cards.id, id), eq(cards.boardId, boardId)));

    if (tagNames !== undefined) {
      await db.delete(cardTags).where(eq(cardTags.cardId, id));
      if (tagNames.length > 0) {
        const tagIds = await upsertTags(tagNames);
        await db.insert(cardTags).values(tagIds.map((tagId) => ({ cardId: id, tagId })));
      }
    }

    const [row] = await db.select().from(cards).where(eq(cards.id, id));
    if (!row) return reply.status(404).send({ error: 'Card not found' });
    return reply.send({ ...row, tags: await getCardTags(id) });
  });

  // DELETE /boards/:boardId/cards/:id
  app.delete<{ Params: { boardId: string; id: string } }>('/boards/:boardId/cards/:id', async (req, reply) => {
    const { boardId, id } = req.params;
    await db.delete(cards).where(and(eq(cards.id, id), eq(cards.boardId, boardId)));
    return reply.status(204).send();
  });
}
