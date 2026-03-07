import { useEffect, useRef } from 'react'

interface ShortcutsOverlayProps {
  onClose: () => void
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
const mod = isMac ? 'Cmd' : 'Ctrl'

const sections = [
  {
    title: 'Navegacao',
    shortcuts: [
      { action: 'Zoom in', keys: ['+'] },
      { action: 'Zoom out', keys: ['-'] },
      { action: 'Ajustar a vista', keys: ['0'] },
    ],
  },
  {
    title: 'Edicao',
    shortcuts: [
      { action: 'Salvar', keys: [mod, 'S'] },
      { action: 'Desfazer', keys: [mod, 'Z'] },
      { action: 'Refazer', keys: [mod, 'Shift', 'Z'] },
      { action: 'Copiar selecionados', keys: [mod, 'C'] },
      { action: 'Colar', keys: [mod, 'V'] },
      { action: 'Deletar selecionados', keys: ['Delete'] },
    ],
  },
  {
    title: 'Selecao e criacao',
    shortcuts: [
      { action: 'Criar card', keys: ['Dbl-click'] },
      { action: 'Criar nota', keys: ['Shift', 'Dbl-click'] },
    ],
  },
  {
    title: 'Apresentacao',
    shortcuts: [
      { action: 'Sair da apresentacao', keys: ['Esc'] },
      { action: 'Proximo slide', keys: ['\u2192', 'Space'] },
      { action: 'Slide anterior', keys: ['\u2190'] },
    ],
  },
]

export function ShortcutsOverlay({ onClose }: ShortcutsOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div className="flex max-h-[85svh] w-full flex-col overflow-hidden rounded-t-2xl bg-fadenbrett-surface shadow-2xl ring-1 ring-fadenbrett-muted/20 sm:max-w-lg sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-fadenbrett-muted/20 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-fadenbrett-text">
              Atalhos de teclado
            </h2>
            <p className="mt-0.5 text-xs text-fadenbrett-muted">
              Pressione <kbd className="rounded bg-fadenbrett-muted/20 px-1 py-0.5 font-mono text-[10px] text-fadenbrett-text">?</kbd> para abrir/fechar
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-fadenbrett-muted hover:bg-fadenbrett-muted/20 hover:text-fadenbrett-text"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Shortcuts grid */}
        <div className="overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-5">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-fadenbrett-muted">
                  {section.title}
                </h3>
                <div className="flex flex-col gap-1">
                  {section.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.action}
                      className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-fadenbrett-muted/10"
                    >
                      <span className="text-fadenbrett-text">
                        {shortcut.action}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, i) => (
                          <span key={i} className="flex items-center gap-1">
                            {i > 0 && (
                              <span className="text-[10px] text-fadenbrett-muted">
                                +
                              </span>
                            )}
                            <kbd className="inline-block min-w-[1.5rem] rounded border border-fadenbrett-muted/30 bg-fadenbrett-bg px-1.5 py-0.5 text-center font-mono text-[11px] text-fadenbrett-text shadow-sm">
                              {key}
                            </kbd>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
