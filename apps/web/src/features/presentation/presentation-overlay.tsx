import { useEffect } from 'react'
import { useBoardStore } from '../../store/board-store'

interface PresentationOverlayProps {
  onStopChange: (stopIndex: number) => void
}

export function PresentationOverlay({ onStopChange }: PresentationOverlayProps) {
  const presentationActive = useBoardStore((s) => s.presentationActive)
  const presentationIndex = useBoardStore((s) => s.presentationIndex)
  const stops = useBoardStore((s) => s.presentationStops)
  const nodes = useBoardStore((s) => s.nodes) as { id: string; type?: string; data: Record<string, unknown> }[]
  const exitPresentation = useBoardStore((s) => s.exitPresentation)
  const nextStop = useBoardStore((s) => s.nextStop)
  const prevStop = useBoardStore((s) => s.prevStop)

  // Keyboard navigation
  useEffect(() => {
    if (!presentationActive) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitPresentation()
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextStop() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prevStop() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [presentationActive, nextStop, prevStop, exitPresentation])

  // Notify parent to zoom when stop changes
  useEffect(() => {
    if (presentationActive) onStopChange(presentationIndex)
  }, [presentationActive, presentationIndex, onStopChange])

  if (!presentationActive) return null

  const currentStop = stops[presentationIndex]
  const node = currentStop ? nodes.find((n) => n.id === currentStop.nodeId) : undefined
  const label = currentStop?.label ?? (node
    ? node.type === 'card'
      ? String(node.data.name ?? 'Card')
      : node.type === 'frame'
      ? String(node.data.title ?? 'Frame')
      : String(node.data.content ?? '').slice(0, 60) || 'Nota'
    : '—')

  return (
    <>
      {/* Semi-transparent read-only indicator */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-center py-2">
        <span className="rounded-full bg-fadenbrett-accent/90 px-3 py-0.5 text-xs font-semibold text-white shadow-lg">
          Modo Apresentação — somente leitura
        </span>
      </div>

      {/* Bottom navigation bar */}
      <div className="absolute inset-x-0 bottom-6 z-40 flex justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-fadenbrett-surface/95 px-5 py-3 shadow-2xl ring-1 ring-fadenbrett-muted/20 backdrop-blur-sm">
          {/* Prev */}
          <button
            onClick={prevStop}
            disabled={presentationIndex === 0}
            className="rounded-lg p-2 text-fadenbrett-muted transition-colors hover:bg-fadenbrett-bg hover:text-fadenbrett-text disabled:opacity-30"
            title="Anterior (←)"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Label + counter */}
          <div className="flex min-w-[180px] flex-col items-center gap-0.5">
            <span className="text-xs text-fadenbrett-muted">
              {presentationIndex + 1} / {stops.length}
            </span>
            <span className="max-w-[240px] truncate text-sm font-medium text-fadenbrett-text">{label}</span>
          </div>

          {/* Next */}
          <button
            onClick={nextStop}
            disabled={presentationIndex === stops.length - 1}
            className="rounded-lg p-2 text-fadenbrett-muted transition-colors hover:bg-fadenbrett-bg hover:text-fadenbrett-text disabled:opacity-30"
            title="Próximo (→)"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="h-6 w-px bg-fadenbrett-muted/20" />

          {/* Exit */}
          <button
            onClick={exitPresentation}
            className="rounded-lg p-2 text-fadenbrett-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
            title="Sair (Esc)"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
