export type ConnectionStyle = 'solid' | 'dashed' | 'dotted'

export const CONNECTION_STYLES: { value: ConnectionStyle; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
]

export const CONNECTION_COLORS = [
  '#b91c1c', // red (roter Faden - default)
  '#d97706', // amber
  '#059669', // emerald
  '#2563eb', // blue
  '#7c3aed', // violet
  '#db2777', // pink
  '#737373', // gray
  '#e5e5e5', // light
]

export interface ConnectionData {
  label: string
  style: ConnectionStyle
  color: string
}

export const DEFAULT_CONNECTION_DATA: ConnectionData = {
  label: '',
  style: 'solid',
  color: '#b91c1c',
}
