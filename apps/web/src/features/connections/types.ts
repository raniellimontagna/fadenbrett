export type ConnectionStyle = 'solid' | 'dashed' | 'dotted'
export type RouteType = 'bezier' | 'straight' | 'step'
export type ConnectionDirection = 'none' | 'forward' | 'backward' | 'both'

export const CONNECTION_STYLES: { value: ConnectionStyle; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
]

export const ROUTE_TYPES: { value: RouteType; label: string }[] = [
  { value: 'bezier', label: 'Bezier' },
  { value: 'straight', label: 'Reta' },
  { value: 'step', label: 'Angulo reto' },
]

export const DIRECTION_TYPES: { value: ConnectionDirection; label: string; title: string }[] = [
  { value: 'none', label: '—', title: 'Sem direção' },
  { value: 'forward', label: 'A→B', title: 'A para B' },
  { value: 'backward', label: 'A←B', title: 'B para A' },
  { value: 'both', label: 'A↔B', title: 'Bidirecional' },
]

export interface RelationType {
  id: string
  label: string
  defaultColor: string
  defaultStyle: ConnectionStyle
}

export const RELATION_TYPES: RelationType[] = [
  { id: 'familia', label: 'Família', defaultColor: '#059669', defaultStyle: 'solid' },
  { id: 'romance', label: 'Romance', defaultColor: '#db2777', defaultStyle: 'solid' },
  { id: 'suspeito', label: 'Suspeito', defaultColor: '#d97706', defaultStyle: 'dashed' },
  { id: 'aliado', label: 'Aliado', defaultColor: '#2563eb', defaultStyle: 'solid' },
  { id: 'inimigo', label: 'Inimigo', defaultColor: '#b91c1c', defaultStyle: 'dashed' },
  { id: 'desconhecido', label: 'Desconhecido', defaultColor: '#6b7280', defaultStyle: 'dotted' },
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
  routeType: RouteType
  curvature: number
  direction: ConnectionDirection
  relationType?: string
}

export const DEFAULT_CONNECTION_DATA: ConnectionData = {
  label: '',
  style: 'solid',
  color: '#b91c1c',
  routeType: 'bezier',
  curvature: 0.3,
  direction: 'none',
  relationType: undefined,
}

