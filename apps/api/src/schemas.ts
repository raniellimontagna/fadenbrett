import { z } from 'zod';

export const CreateBoardSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
});

export const UpdateBoardSchema = z.object({
  name: z.string().min(1).max(200).optional(),
});

export const CreateCardSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(500),
  description: z.string().default(''),
  avatar: z.string().default(''),
  eraLabel: z.string().default(''),
  groupColor: z.string().default(''),
  imageUrl: z.string().default(''),
  positionX: z.number().default(0),
  positionY: z.number().default(0),
  tags: z.array(z.string()).default([]),
});

export const UpdateCardSchema = CreateCardSchema.partial();

export const CreateNoteSchema = z.object({
  id: z.string().optional(),
  content: z.string().default(''),
  color: z.string().default('#fde68a'),
  rotation: z.number().default(0),
  positionX: z.number().default(0),
  positionY: z.number().default(0),
});

export const UpdateNoteSchema = CreateNoteSchema.partial();

export const CreateConnectionSchema = z.object({
  id: z.string().optional(),
  sourceId: z.string(),
  targetId: z.string(),
  label: z.string().default(''),
  style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  color: z.string().default('#a78bfa'),
});

export const UpdateConnectionSchema = CreateConnectionSchema.partial().omit({ sourceId: true, targetId: true });

export const AutosaveSchema = z.object({
  nodes: z.array(z.unknown()),
  edges: z.array(z.unknown()),
});

export type CreateBoard = z.infer<typeof CreateBoardSchema>;
export type UpdateBoard = z.infer<typeof UpdateBoardSchema>;
export type CreateCard = z.infer<typeof CreateCardSchema>;
export type UpdateCard = z.infer<typeof UpdateCardSchema>;
export type CreateNote = z.infer<typeof CreateNoteSchema>;
export type UpdateNote = z.infer<typeof UpdateNoteSchema>;
export type CreateConnection = z.infer<typeof CreateConnectionSchema>;
export type UpdateConnection = z.infer<typeof UpdateConnectionSchema>;
