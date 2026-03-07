import type { Node, Edge } from '@xyflow/react'

export interface CollabUser {
  id: string
  name: string
  color: string
  cursor: { x: number; y: number } | null
  lastSeen: number
}

// Messages broadcast between tabs
export type CollabMessage =
  | { type: 'state-sync'; boardId: string; nodes: Node[]; edges: Edge[]; user: CollabUser }
  | { type: 'cursor-move'; boardId: string; userId: string; cursor: { x: number; y: number } }
  | { type: 'presence'; boardId: string; user: CollabUser }
  | { type: 'leave'; boardId: string; userId: string }

export const USER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
]

const ADJECTIVES = ['Veloz', 'Astuto', 'Curioso', 'Sombrio', 'Lerdo', 'Audaz', 'Silencioso']
const NOUNS = ['Detetive', 'Analista', 'Investigador', 'Cronista', 'Observador', 'Arquivista']

export function generateUser(): CollabUser {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
  return {
    id: crypto.randomUUID(),
    name: `${adj} ${noun}`,
    color,
    cursor: null,
    lastSeen: Date.now(),
  }
}
