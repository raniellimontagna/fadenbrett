import { useMemo } from 'react'
import { useBoardStore } from '../../store/board-store'
import { type CardData } from '../cards/types'
import { type ConnectionData } from '../connections/types'

interface ConnectionEntry {
  edgeId: string
  direction: 'outgoing' | 'incoming'
  connectedNodeId: string
  connectedTitle: string
  connectedAvatar: string
  connectedColor: string
  label: string
  style: ConnectionData['style']
  color: string
}

interface DetailPanelProps {
  onNavigateTo: (nodeId: string) => void
  onEdit: () => void
}

const STYLE_ICON: Record<ConnectionData['style'], string> = {
  solid: '—',
  dashed: '- -',
  dotted: '···',
}

export function DetailPanel({ onNavigateTo, onEdit }: DetailPanelProps) {
  const { nodes, edges, selectedCardId, selectCard } = useBoardStore()

  const card = useMemo(() => {
    if (!selectedCardId) return null
    const node = nodes.find((n) => n.id === selectedCardId)
    return node ? (node.data as unknown as CardData) : null
  }, [nodes, selectedCardId])

  const connections = useMemo<ConnectionEntry[]>(() => {
    if (!selectedCardId) return []
    const result: ConnectionEntry[] = []

    for (const edge of edges) {
      const isSource = edge.source === selectedCardId
      const isTarget = edge.target === selectedCardId
      if (!isSource && !isTarget) continue

      const connectedId = isSource ? edge.target : edge.source
      const connectedNode = nodes.find((n) => n.id === connectedId)
      if (!connectedNode) continue

      const conn = edge.data as unknown as ConnectionData
      let connectedTitle = 'Sem título'
      let connectedAvatar = '?'
      let connectedColor = '#737373'

      if (connectedNode.type === 'card') {
        const c = connectedNode.data as unknown as CardData
        connectedTitle = c.title || 'Sem título'
        connectedAvatar =
          c.avatarType === 'emoji' && c.avatarValue
            ? c.avatarValue
            : (c.title?.slice(0, 2).toUpperCase() ?? '?')
        connectedColor = c.groupColor
      } else if (connectedNode.type === 'note') {
        const noteData = connectedNode.data as unknown as { content?: string }
        connectedTitle = noteData.content?.slice(0, 30) || 'Nota'
        connectedAvatar = '📝'
        connectedColor = '#737373'
      }

      result.push({
        edgeId: edge.id,
        direction: isSource ? 'outgoing' : 'incoming',
        connectedNodeId: connectedId,
        connectedTitle,
        connectedAvatar,
        connectedColor,
        label: conn?.label ?? '',
        style: conn?.style ?? 'solid',
        color: conn?.color ?? '#b91c1c',
      })
    }

    return result
  }, [selectedCardId, edges, nodes])

  if (!card || !selectedCardId) return null

  const displayAvatar =
    card.avatarType === 'emoji' && card.avatarValue
      ? card.avatarValue
      : card.title
        ? card.title.slice(0, 2).toUpperCase()
        : '?'

  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex max-h-[65vh] flex-col rounded-t-xl border-t border-fadenbrett-muted/20 bg-fadenbrett-surface/95 shadow-2xl backdrop-blur-sm sm:inset-x-auto sm:right-0 sm:bottom-auto sm:top-0 sm:h-full sm:max-h-none sm:w-72 sm:rounded-none sm:border-l sm:border-t-0"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        className="flex items-start gap-3 border-b border-fadenbrett-muted/20 p-4"
        style={{ borderLeftColor: card.groupColor, borderLeftWidth: 4 }}
      >
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl"
          style={{ backgroundColor: card.groupColor + '33', color: card.groupColor }}
        >
          {card.avatarType === 'emoji' && card.avatarValue ? (
            <span>{card.avatarValue}</span>
          ) : (
            <span className="text-sm font-bold">{displayAvatar}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-fadenbrett-text">
            {card.title || 'Sem título'}
          </h2>
          {card.eraLabel && (
            <p className="text-xs text-fadenbrett-muted">{card.eraLabel}</p>
          )}
        </div>
        <button
          onClick={() => selectCard(null)}
          className="ml-1 shrink-0 rounded p-1 text-fadenbrett-muted hover:bg-fadenbrett-muted/20 hover:text-fadenbrett-text"
          title="Fechar"
        >
          ✕
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Description */}
        {card.description && (
          <section>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-fadenbrett-muted">
              Descrição
            </h3>
            <p className="text-sm leading-relaxed text-fadenbrett-text">{card.description}</p>
          </section>
        )}

        {/* Tags */}
        {card.tags.length > 0 && (
          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-fadenbrett-muted">
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-fadenbrett-muted/20 px-2.5 py-0.5 text-xs text-fadenbrett-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Connections */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-fadenbrett-muted">
            Conexões ({connections.length})
          </h3>
          {connections.length === 0 ? (
            <p className="text-xs text-fadenbrett-muted/60">Nenhuma conexão</p>
          ) : (
            <ul className="space-y-2">
              {connections.map((conn) => (
                <li key={conn.edgeId}>
                  <button
                    className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-fadenbrett-muted/10"
                    onClick={() => onNavigateTo(conn.connectedNodeId)}
                    title={`Navegar para ${conn.connectedTitle}`}
                  >
                    {/* Direction arrow */}
                    <span
                      className="shrink-0 text-xs"
                      style={{ color: conn.color }}
                    >
                      {conn.direction === 'outgoing' ? '→' : '←'}
                    </span>

                    {/* Connected node avatar */}
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px]"
                      style={{ backgroundColor: conn.connectedColor + '33', color: conn.connectedColor }}
                    >
                      {conn.connectedAvatar}
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-fadenbrett-text">
                        {conn.connectedTitle}
                      </p>
                      {conn.label && (
                        <p className="truncate text-[10px] text-fadenbrett-muted">{conn.label}</p>
                      )}
                    </div>

                    {/* Style indicator */}
                    <span
                      className="shrink-0 font-mono text-[10px]"
                      style={{ color: conn.color }}
                      title={conn.style}
                    >
                      {STYLE_ICON[conn.style]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Footer — Edit button */}
      <div className="border-t border-fadenbrett-muted/20 p-3">
        <button
          onClick={onEdit}
          className="w-full rounded-lg bg-fadenbrett-muted/20 py-2 text-sm font-medium text-fadenbrett-text transition-colors hover:bg-fadenbrett-muted/30"
        >
          Editar card
        </button>
      </div>
    </div>
  )
}
