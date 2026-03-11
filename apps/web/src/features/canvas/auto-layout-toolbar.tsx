import { useState, useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useBoardStore } from '../../store/board-store'
import { computeLayout, type LayoutAlgorithm } from '../../lib/auto-layout'

const ALGORITHMS: Array<{ value: LayoutAlgorithm; label: string; icon: string }> = [
  { value: 'force', label: 'Força', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z' },
  { value: 'hierarchical', label: 'Hierárquico', icon: 'M12 3v18M5 8h14M3 13h18' },
  { value: 'radial', label: 'Radial', icon: 'M12 12m-9 0a9 9 0 1 0 18 0 9 9 0 1 0-18 0M12 12m-4 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0M12 12h0' },
]

export function AutoLayoutToolbar() {
  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const nodes = useBoardStore((s) => s.nodes)
  const edges = useBoardStore((s) => s.edges)
  const applyAutoLayout = useBoardStore((s) => s.applyAutoLayout)
  const { fitView } = useReactFlow()

  const run = useCallback(
    async (algorithm: LayoutAlgorithm, selectedOnly: boolean) => {
      setRunning(true)
      setOpen(false)
      try {
        const selectedIds = selectedOnly
          ? nodes.filter((n) => n.selected).map((n) => n.id)
          : undefined

        if (selectedOnly && (!selectedIds || selectedIds.length < 2)) {
          return // need at least 2 selected nodes
        }

        const positions = await computeLayout(nodes, edges, algorithm, selectedIds)
        applyAutoLayout(positions)
        setTimeout(() => fitView({ duration: 400 }), 50)
      } finally {
        setRunning(false)
      }
    },
    [nodes, edges, applyAutoLayout, fitView],
  )

  const selectedCount = nodes.filter((n) => n.selected).length

  return (
    <div className="relative" data-export-exclude="true">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={running}
        title="Auto-layout"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-fadenbrett-muted/30 bg-fadenbrett-surface/90 text-fadenbrett-muted shadow-lg backdrop-blur-sm transition-colors hover:text-fadenbrett-text disabled:opacity-50"
      >
        {running ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <rect x="3" y="3" width="6" height="6" rx="1" />
            <rect x="15" y="3" width="6" height="6" rx="1" />
            <rect x="9" y="15" width="6" height="6" rx="1" />
            <path d="M9 6h6M6 9v3h3M18 9v3h-3" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-30 flex w-48 flex-col gap-1 rounded-xl border border-fadenbrett-muted/20 bg-fadenbrett-surface p-2 shadow-xl">
          <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-fadenbrett-muted">
            Auto-layout
          </span>
          {ALGORITHMS.map((alg) => (
            <button
              key={alg.value}
              onClick={() => run(alg.value, false)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-fadenbrett-text transition-colors hover:bg-fadenbrett-muted/15"
            >
              <svg className="h-3.5 w-3.5 text-fadenbrett-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d={alg.icon} />
              </svg>
              {alg.label}
            </button>
          ))}
          {selectedCount >= 2 && (
            <>
              <div className="mx-2 my-1 h-px bg-fadenbrett-muted/20" />
              <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-fadenbrett-muted">
                Selecionados ({selectedCount})
              </span>
              {ALGORITHMS.map((alg) => (
                <button
                  key={`sel-${alg.value}`}
                  onClick={() => run(alg.value, true)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-fadenbrett-muted transition-colors hover:bg-fadenbrett-muted/15 hover:text-fadenbrett-text"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path d={alg.icon} />
                  </svg>
                  {alg.label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
