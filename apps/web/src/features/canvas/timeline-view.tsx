import { useMemo } from 'react'
import { useBoardStore } from '../../store/board-store'
import { type CardData } from '../cards/types'
import { type ConnectionData } from '../connections/types'

interface TimelineCard {
  id: string
  card: CardData
  connections: Array<{ targetId: string; label: string; color: string; style: ConnectionData['style'] }>
  dimmed: boolean
}

interface EraColumn {
  era: string
  cards: TimelineCard[]
}

export function TimelineView() {
  const { nodes, edges, activeFilters } = useBoardStore()

  const filtersActive = useMemo(
    () =>
      activeFilters.groups.length > 0 ||
      activeFilters.tags.length > 0 ||
      activeFilters.eras.length > 0 ||
      activeFilters.connectionStyles.length > 0,
    [activeFilters],
  )

  const matchedCardIds = useMemo(() => {
    if (!filtersActive) return null
    const ids = new Set<string>()
    for (const node of nodes) {
      if (node.type !== 'card') continue
      const card = node.data as unknown as CardData
      const groupMatch = activeFilters.groups.length === 0 || activeFilters.groups.includes(card.groupColor)
      const tagMatch = activeFilters.tags.length === 0 || card.tags.some((t) => activeFilters.tags.includes(t))
      const eraMatch = activeFilters.eras.length === 0 || activeFilters.eras.includes(card.eraLabel)
      if (groupMatch && tagMatch && eraMatch) ids.add(node.id)
    }
    return ids
  }, [nodes, activeFilters, filtersActive])

  const columns = useMemo<EraColumn[]>(() => {
    const cardNodes = nodes.filter((n) => n.type === 'card')

    // Build connection map
    const connectionsBySource = new Map<string, Array<{ targetId: string; label: string; color: string; style: ConnectionData['style'] }>>()
    for (const edge of edges) {
      const conn = edge.data as unknown as ConnectionData
      const styleMatch =
        activeFilters.connectionStyles.length === 0 ||
        activeFilters.connectionStyles.includes(conn?.style as never)
      if (!styleMatch) continue
      const list = connectionsBySource.get(edge.source) ?? []
      list.push({
        targetId: edge.target,
        label: conn?.label ?? '',
        color: conn?.color ?? '#b91c1c',
        style: conn?.style ?? 'solid',
      })
      connectionsBySource.set(edge.source, list)
    }

    // Group by eraLabel
    const eraMap = new Map<string, TimelineCard[]>()
    for (const node of cardNodes) {
      const card = node.data as unknown as CardData
      const era = card.eraLabel || '(sem era)'
      const dimmed = filtersActive ? !(matchedCardIds?.has(node.id) ?? true) : false
      const entry: TimelineCard = {
        id: node.id,
        card,
        connections: connectionsBySource.get(node.id) ?? [],
        dimmed,
      }
      const list = eraMap.get(era) ?? []
      list.push(entry)
      eraMap.set(era, list)
    }

    // Sort eras: put '(sem era)' last
    const eras = Array.from(eraMap.keys()).sort((a, b) => {
      if (a === '(sem era)') return 1
      if (b === '(sem era)') return -1
      return a.localeCompare(b)
    })

    return eras.map((era) => ({ era, cards: eraMap.get(era)! }))
  }, [nodes, edges, activeFilters, filtersActive, matchedCardIds])

  if (columns.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-fadenbrett-muted text-sm">Nenhum card criado ainda.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full gap-4 overflow-x-auto px-6 py-8">
      {columns.map((col) => (
        <div key={col.era} className="flex shrink-0 flex-col gap-3" style={{ width: 220 }}>
          {/* Era header */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-fadenbrett-accent/40" />
            <span className="rounded-full border border-fadenbrett-accent/50 px-3 py-0.5 text-xs font-semibold text-fadenbrett-accent">
              {col.era}
            </span>
            <div className="h-px flex-1 bg-fadenbrett-accent/40" />
          </div>

          {/* Cards */}
          {col.cards.map((entry) => (
            <TimelineCard key={entry.id} entry={entry} allNodes={nodes} />
          ))}
        </div>
      ))}
    </div>
  )
}

function TimelineCard({
  entry,
  allNodes,
}: {
  entry: TimelineCard
  allNodes: ReturnType<typeof useBoardStore.getState>['nodes']
}) {
  const { card, connections, dimmed } = entry

  const displayAvatar =
    card.avatarType === 'emoji' && card.avatarValue
      ? card.avatarValue
      : card.title
        ? card.title.slice(0, 2).toUpperCase()
        : '?'

  return (
    <div
      className="rounded-lg border-2 bg-fadenbrett-surface p-3 shadow-md transition-opacity"
      style={{
        borderLeftColor: card.groupColor,
        borderLeftWidth: 4,
        borderColor: `${card.groupColor}55`,
        opacity: dimmed ? 0.18 : 1,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
          style={{ backgroundColor: card.groupColor + '33', color: card.groupColor }}
        >
          {card.avatarType === 'emoji' && card.avatarValue ? (
            <span>{card.avatarValue}</span>
          ) : (
            <span className="text-[10px] font-bold">{displayAvatar}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-fadenbrett-text">
            {card.title || 'Sem título'}
          </p>
        </div>
      </div>

      {/* Tags */}
      {card.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {card.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-fadenbrett-muted/20 px-1.5 py-0.5 text-[9px] text-fadenbrett-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Connections */}
      {connections.length > 0 && (
        <div className="mt-2 space-y-1 border-t border-fadenbrett-muted/15 pt-2">
          {connections.slice(0, 3).map((conn, i) => {
            const targetNode = allNodes.find((n) => n.id === conn.targetId)
            const targetCard = targetNode?.data as unknown as CardData | undefined
            const targetTitle = targetCard?.title || conn.targetId.slice(0, 8)
            return (
              <div key={i} className="flex items-center gap-1 text-[9px] text-fadenbrett-muted">
                <span style={{ color: conn.color }}>→</span>
                <span className="truncate">{conn.label || targetTitle}</span>
              </div>
            )
          })}
          {connections.length > 3 && (
            <p className="text-[9px] text-fadenbrett-muted/60">+{connections.length - 3} mais</p>
          )}
        </div>
      )}
    </div>
  )
}
