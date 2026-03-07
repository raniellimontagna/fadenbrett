import { useBoardStore } from '../../store/board-store'

function getNodeLabel(nodes: { id: string; type?: string; data: Record<string, unknown> }[], nodeId: string): string {
  const node = nodes.find((n) => n.id === nodeId)
  if (!node) return `Nó removido (${nodeId.slice(0, 6)})`
  if (node.type === 'card') return String(node.data.name ?? 'Card sem título')
  if (node.type === 'frame') return String(node.data.title ?? 'Frame sem título')
  // note
  const content = String(node.data.content ?? '')
  return content.slice(0, 40) || 'Nota vazia'
}

export function PresentationPanel() {
  const nodes = useBoardStore((s) => s.nodes) as { id: string; type?: string; data: Record<string, unknown> }[]
  const stops = useBoardStore((s) => s.presentationStops)
  const startPresentation = useBoardStore((s) => s.startPresentation)
  const removePresentationStop = useBoardStore((s) => s.removePresentationStop)
  const movePresentationStop = useBoardStore((s) => s.movePresentationStop)

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-fadenbrett-muted">
          Apresentação
        </span>
        <span className="text-xs text-fadenbrett-muted">{stops.length} pasos</span>
      </div>

      {stops.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <svg className="h-8 w-8 text-fadenbrett-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.899L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-xs text-fadenbrett-muted leading-relaxed">
            Clique com o botão direito em um card, nota ou frame e escolha{' '}
            <span className="font-medium text-fadenbrett-text">Adicionar à Apresentação</span>.
          </p>
        </div>
      ) : (
        <ol className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {stops.map((stop, idx) => (
            <li
              key={stop.id}
              className="flex items-center gap-2 rounded-md bg-fadenbrett-surface/50 px-2 py-1.5 text-xs"
            >
              <span className="w-4 shrink-0 text-center font-mono text-fadenbrett-muted">{idx + 1}</span>
              <span className="flex-1 truncate text-fadenbrett-text">
                {stop.label ?? getNodeLabel(nodes, stop.nodeId)}
              </span>
              <div className="flex shrink-0 gap-0.5">
                <button
                  onClick={() => movePresentationStop(stop.id, 'up')}
                  disabled={idx === 0}
                  className="rounded p-0.5 text-fadenbrett-muted hover:text-fadenbrett-text disabled:opacity-30"
                  title="Mover para cima"
                >
                  ↑
                </button>
                <button
                  onClick={() => movePresentationStop(stop.id, 'down')}
                  disabled={idx === stops.length - 1}
                  className="rounded p-0.5 text-fadenbrett-muted hover:text-fadenbrett-text disabled:opacity-30"
                  title="Mover para baixo"
                >
                  ↓
                </button>
                <button
                  onClick={() => removePresentationStop(stop.id)}
                  className="rounded p-0.5 text-fadenbrett-muted hover:text-red-400"
                  title="Remover"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <button
        onClick={startPresentation}
        disabled={stops.length === 0}
        className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-fadenbrett-accent px-3 py-2 text-xs font-semibold text-white transition-opacity disabled:opacity-40 hover:opacity-90"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        Iniciar Apresentação
      </button>
    </div>
  )
}
