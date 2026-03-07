export interface FrameData {
  id: string
  title: string
  color: string
  width: number
  height: number
}

export const FRAME_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6b7280', // gray
] as const

export const DEFAULT_FRAME_DATA: Omit<FrameData, 'id'> = {
  title: 'Grupo',
  color: FRAME_COLORS[0],
  width: 480,
  height: 340,
}
