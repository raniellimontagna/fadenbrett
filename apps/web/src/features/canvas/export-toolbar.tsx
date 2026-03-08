import { toPng, toJpeg } from 'html-to-image'
import { useCallback, useState } from 'react'
import { useBoardStore } from '../../store/board-store'

interface ExportToolbarProps {
  /** ref to the React Flow wrapper div */
  containerRef: React.RefObject<HTMLDivElement | null>
}

type Scale = 1 | 2 | 4

export function ExportToolbar({ containerRef }: ExportToolbarProps) {
  const { nodes, edges, boards, activeBoardId } = useBoardStore()
  const [open, setOpen] = useState(false)
  const [scale, setScale] = useState<Scale>(2)
  const [exporting, setExporting] = useState(false)

  const activeBoard = boards[activeBoardId]

  const exportData = useCallback(() => {
    if (!activeBoard) return
    const payload = {
      schema_version: 1,
      board: { name: activeBoard.name, nodes, edges },
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeBoard.name.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }, [activeBoard, nodes, edges])

  const doExport = useCallback(
    async (format: 'png' | 'jpg') => {
      const el = containerRef.current
      if (!el) return
      setExporting(true)
      try {
        const opts = {
          pixelRatio: scale,
          backgroundColor: '#1a1a1a',
          // Exclude overlaid UI panels from the export
          filter: (node: Node) => {
            if (node instanceof HTMLElement) {
              if (node.dataset.exportExclude === 'true') return false
            }
            return true
          },
        }
        const dataUrl =
          format === 'png' ? await toPng(el, opts) : await toJpeg(el, { ...opts, quality: 0.95 })
        const a = document.createElement('a')
        a.href = dataUrl
        const fileName = activeBoard ? activeBoard.name.replace(/\s+/g, '_') : 'fadenbrett-export'
        a.download = `${fileName}.${format}`
        a.click()
      } catch (err) {
        console.error('Export failed', err)
      } finally {
        setExporting(false)
        setOpen(false)
      }
    },
    [containerRef, scale, activeBoard],
  )

  return (
    <div className="relative" data-export-exclude="true">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Exportar board"
        className="flex items-center gap-1.5 rounded-lg border border-fadenbrett-muted/20 bg-fadenbrett-surface/90 px-3 py-1.5 text-xs text-fadenbrett-muted shadow backdrop-blur-sm transition-colors hover:bg-fadenbrett-muted/20 hover:text-fadenbrett-text"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Exportar
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-30 flex w-56 flex-col gap-2 rounded-xl border border-fadenbrett-muted/20 bg-fadenbrett-surface p-3 shadow-xl">
          {/* Scale selector for images */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-fadenbrett-muted">Qualidade Imagem</span>
              <div className="flex gap-1">
                {([1, 2, 4] as Scale[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
                      scale === s
                        ? 'bg-fadenbrett-accent text-white'
                        : 'bg-fadenbrett-muted/20 text-fadenbrett-muted hover:bg-fadenbrett-muted/30'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={exporting}
                onClick={() => doExport('png')}
                className="flex items-center justify-center gap-2 rounded-lg bg-fadenbrett-muted/10 py-2 text-xs font-medium text-fadenbrett-text transition-colors hover:bg-fadenbrett-muted/20 disabled:opacity-50"
              >
                PNG
              </button>
              <button
                disabled={exporting}
                onClick={() => doExport('jpg')}
                className="flex items-center justify-center gap-2 rounded-lg bg-fadenbrett-muted/10 py-2 text-xs font-medium text-fadenbrett-text transition-colors hover:bg-fadenbrett-muted/20 disabled:opacity-50"
              >
                JPG
              </button>
            </div>
          </div>

          <div className="h-px bg-fadenbrett-muted/20" />

          {/* Data export */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-fadenbrett-muted">Dados do Board</span>
            <button
              onClick={exportData}
              className="flex items-center justify-center gap-2 rounded-lg border border-fadenbrett-accent/30 bg-fadenbrett-accent/10 py-2 text-xs font-medium text-fadenbrett-accent transition-colors hover:bg-fadenbrett-accent/20"
            >
              Exportar para JSON
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
