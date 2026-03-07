import { useEffect, useRef } from 'react'
import { BOARD_TEMPLATES, type BoardTemplate } from './templates-data'

interface TemplateGalleryProps {
  onApply: (template: BoardTemplate) => void
  onClose: () => void
}

export function TemplateGallery({ onApply, onClose }: TemplateGalleryProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="flex h-[85svh] w-full flex-col overflow-hidden rounded-t-2xl bg-fadenbrett-surface shadow-2xl ring-1 ring-fadenbrett-muted/20 sm:h-auto sm:max-h-[80vh] sm:max-w-3xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-fadenbrett-muted/20 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-fadenbrett-text">Galeria de Templates</h2>
            <p className="text-xs text-fadenbrett-muted mt-0.5">Escolha um template para criar um board editável em 1 clique</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-fadenbrett-muted hover:bg-fadenbrett-muted/20 hover:text-fadenbrett-text"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 overflow-y-auto p-6 sm:grid-cols-2 lg:grid-cols-3">
          {BOARD_TEMPLATES.map((tpl) => (
            <TemplateCard key={tpl.id} template={tpl} onApply={onApply} />
          ))}
        </div>
      </div>
    </div>
  )
}

function TemplateCard({ template, onApply }: { template: BoardTemplate; onApply: (t: BoardTemplate) => void }) {
  const cardCount = template.nodes.filter((n) => n.type === 'card').length
  const noteCount = template.nodes.filter((n) => n.type === 'note').length
  const connCount = template.edges.length

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-fadenbrett-muted/20 bg-fadenbrett-bg p-4 transition-colors hover:border-fadenbrett-accent/50">
      {/* Emoji + title */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{template.emoji}</span>
        <div>
          <h3 className="font-semibold text-fadenbrett-text">{template.name}</h3>
          <span className="text-[10px] uppercase tracking-wide text-fadenbrett-muted">{template.genre}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed text-fadenbrett-muted flex-1">{template.description}</p>

      {/* Stats */}
      <div className="flex gap-3 text-[10px] text-fadenbrett-muted">
        <span>{cardCount} cards</span>
        <span>{noteCount} notas</span>
        <span>{connCount} conexões</span>
      </div>

      {/* Apply button */}
      <button
        onClick={() => onApply(template)}
        className="mt-auto flex items-center justify-center gap-1.5 rounded-lg bg-fadenbrett-accent px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Usar Template
      </button>
    </div>
  )
}
