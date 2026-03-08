import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const boards = sqliteTable('boards', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').default(''),
  color: text('color').default(''),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  snapshot: text('snapshot'), // full JSON snapshot for autosave
});

export const cards = sqliteTable('cards', {
  id: text('id').primaryKey(),
  boardId: text('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').default(''),
  avatar: text('avatar').default(''),
  eraLabel: text('era_label').default(''),
  groupColor: text('group_color').default(''),
  imageUrl: text('image_url').default(''),
  positionX: real('position_x').notNull().default(0),
  positionY: real('position_y').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  boardId: text('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  content: text('content').notNull().default(''),
  color: text('color').notNull().default('#fde68a'),
  rotation: real('rotation').notNull().default(0),
  positionX: real('position_x').notNull().default(0),
  positionY: real('position_y').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const connections = sqliteTable('connections', {
  id: text('id').primaryKey(),
  boardId: text('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  sourceId: text('source_id').notNull(),
  targetId: text('target_id').notNull(),
  label: text('label').default(''),
  style: text('style').notNull().default('solid'),
  color: text('color').notNull().default('#a78bfa'),
  routeType: text('route_type').notNull().default('bezier'),
  curvature: real('curvature').notNull().default(0.3),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
});

export const cardTags = sqliteTable('card_tags', {
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
});
