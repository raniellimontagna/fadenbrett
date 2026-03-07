export interface NoteData {
  id: string
  content: string
  color: string
  rotation: number
}

export const NOTE_COLORS = [
  '#fef08a', // yellow
  '#86efac', // green
  '#93c5fd', // blue
  '#fca5a5', // red/pink
  '#c4b5fd', // purple
  '#fdba74', // orange
] as const

export const DEFAULT_NOTE_DATA: Omit<NoteData, 'id'> = {
  content: '',
  color: NOTE_COLORS[0],
  rotation: 0,
}
