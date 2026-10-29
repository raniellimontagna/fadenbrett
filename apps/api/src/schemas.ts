import { z } from 'zod';

export const CreateBoardSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(200).default(''),
  color: z.string().max(20).default(''),
});

export const UpdateBoardSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(200).optional(),
  color: z.string().max(20).optional(),
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

// Zod 4 applies .default() inside .partial(), so the Update schemas list their
// fields without defaults. Otherwise a PATCH resets every field it does not send.
export const UpdateCardSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  avatar: z.string().optional(),
  eraLabel: z.string().optional(),
  groupColor: z.string().optional(),
  imageUrl: z.string().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

export const CreateNoteSchema = z.object({
  id: z.string().optional(),
  content: z.string().default(''),
  color: z.string().default('#fde68a'),
  rotation: z.number().default(0),
  positionX: z.number().default(0),
  positionY: z.number().default(0),
});

export const UpdateNoteSchema = z.object({
  id: z.string().optional(),
  content: z.string().optional(),
  color: z.string().optional(),
  rotation: z.number().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
});

export const CreateConnectionSchema = z.object({
  id: z.string().optional(),
  sourceId: z.string(),
  targetId: z.string(),
  label: z.string().default(''),
  style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  color: z.string().default('#a78bfa'),
  routeType: z.enum(['bezier', 'straight', 'step']).default('bezier'),
  curvature: z.number().min(0).max(1).default(0.3),
});

export const UpdateConnectionSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional(),
  style: z.enum(['solid', 'dashed', 'dotted']).optional(),
  color: z.string().optional(),
  routeType: z.enum(['bezier', 'straight', 'step']).optional(),
  curvature: z.number().min(0).max(1).optional(),
});

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
