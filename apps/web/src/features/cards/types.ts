export interface CardData {
  id: string
  title: string
  description: string
  avatarType: 'emoji' | 'initials'
  avatarValue: string
  tags: string[]
  eraLabel: string
  groupColor: string
  imageUrl?: string
}

export const GROUP_COLORS = [
  '#b91c1c', // red
  '#2563eb', // blue
  '#16a34a', // green
  '#ca8a04', // yellow
  '#9333ea', // purple
  '#ea580c', // orange
  '#0891b2', // cyan
  '#be185d', // pink
] as const

export const DEFAULT_CARD_DATA: Omit<CardData, 'id'> = {
  title: '',
  description: '',
  avatarType: 'emoji',
  avatarValue: '',
  tags: [],
  eraLabel: '',
  groupColor: GROUP_COLORS[0],
  imageUrl: '',
}
