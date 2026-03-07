import { toPng, toJpeg } from 'html-to-image'
import { useCallback, useState } from 'react'

interface ExportToolbarProps {
  /** ref to the React Flow wrapper div */
  containerRef: React.RefObject<HTMLDivElement | null>
}

type Scale = 1 | 2 | 4

export function ExportToolbar({ containerRef }: ExportToolbarProps) {
  const [open, setOpen] = useState(false)
  const [scale, setScale] = useState<Scale>(2)
  const [exporting, setExporting] = useState(false)

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
        a.download = `fadenbrett-export.${format}`
        a.click()
      } catch (err) {
        console.error('Export failed', err)
      } finally {
        setExporting(false)
        setOpen(false)
      }
    },
    [containerRef, scale],
  )

  return (
    <div className="relative" data-export-exclude="true">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Exportar board"
        className="flex items-center gap-1.5 rounded-lg border border-fadenbrett-muted/20 bg-fadenbrett-surface/90 px-3 py-1.5 text-xs text-fadenbrett-muted shadow backdrop-blur-sm transition-colors hover:bg-fadenbrett-muted/20 hover:text-fadenbrett-text"
      >
        ↓ Exportar
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-30 flex w-48 flex-col gap-2 rounded-xl border border-fadenbrett-muted/20 bg-fadenbrett-surface p-3 shadow-xl">
          {/* Scale selector */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-fadenbrett-muted">Escala</span>
            <div className="flex gap-1">
              {([1, 2, 4] as Scale[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={`rounded px-2 py-0.5 text-xs transition-colors ${
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

          <div className="h-px bg-fadenbrett-muted/20" />

          <button
            disabled={exporting}
            onClick={() => doExport('png')}
            className="rounded-lg bg-fadenbrett-muted/20 py-1.5 text-xs font-medium text-fadenbrett-text transition-colors hover:bg-fadenbrett-muted/30 disabled:opacity-50"
          >
            {exporting ? 'Exportando…' : 'PNG'}
          </button>
          <button
            disabled={exporting}
            onClick={() => doExport('jpg')}
            className="rounded-lg bg-fadenbrett-muted/20 py-1.5 text-xs font-medium text-fadenbrett-text transition-colors hover:bg-fadenbrett-muted/30 disabled:opacity-50"
          >
            {exporting ? 'Exportando…' : 'JPG'}
          </button>
        </div>
      )}
    </div>
  )
}
