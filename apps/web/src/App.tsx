import { useState, useCallback, useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { InvestigationCanvas } from './features/canvas/investigation-canvas'
import { TimelineView } from './features/canvas/timeline-view'
import { FilterBar } from './features/filters/filter-bar'
import { BoardSidebar } from './features/canvas/board-sidebar'
import { PresentationPanel } from './features/presentation/presentation-panel'
import { PresenceBar } from './features/collab/presence-bar'
import { TemplateGallery } from './features/templates/template-gallery'
import { ShortcutsOverlay } from './features/canvas/shortcuts-overlay'
import { useBoardStore } from './store/board-store'

type ViewMode = 'canvas' | 'timeline'

export default function App() {
  const [view, setView] = useState<ViewMode>('canvas')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [presentationPanelOpen, setPresentationPanelOpen] = useState(false)
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const applyTemplate = useBoardStore((s) => s.applyTemplate)
  const loadBoards = useBoardStore((s) => s.loadBoards)
  const apiStatus = useBoardStore((s) => s.apiStatus)
  const apiError = useBoardStore((s) => s.apiError)

  useEffect(() => { void loadBoards() }, [loadBoards])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === '?') setShortcutsOpen((p) => !p)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const boards = useBoardStore((s) => s.boards)
  const activeBoardId = useBoardStore((s) => s.activeBoardId)
  const searchQuery = useBoardStore((s) => s.searchQuery)
  const setSearchQuery = useBoardStore((s) => s.setSearchQuery)
  const theme = useBoardStore((s) => s.theme)
  const setTheme = useBoardStore((s) => s.setTheme)

  const activeBoardName = boards[activeBoardId]?.name ?? 'Board'

  const handleSearchKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') setSearchQuery('')
    },
    [setSearchQuery],
  )

  if (apiStatus === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-fadenbrett-bg">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-fadenbrett-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <span className="text-sm text-fadenbrett-muted">Conectando ao servidor…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      {/* API error banner */}
      {apiStatus === 'error' && (
        <div className="flex items-center gap-2 bg-red-900/80 px-4 py-1.5 text-xs text-red-100">
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span>API indisponível: {apiError ?? 'Erro desconhecido'}. Operações de persistência estão desabilitadas.</span>
        </div>
      )}

      {/* Top bar */}
      <header className="shrink-0 border-b border-fadenbrett-muted/20 bg-fadenbrett-surface">
        {/* Primary row */}
        <div className="flex h-12 items-center gap-2 px-3 md:h-10">
          {/* Sidebar / hamburger toggle */}
          <button
            onClick={() => { setSidebarOpen((p) => !p); setMobileMenuOpen(false) }}
            className="shrink-0 rounded p-1.5 text-fadenbrett-muted hover:bg-fadenbrett-muted/10 hover:text-fadenbrett-text"
            title="Alternar sidebar"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Brand */}
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-sm font-semibold tracking-wide text-fadenbrett-text">Fadenbrett</span>
            <span className="hidden max-w-[80px] truncate text-xs text-fadenbrett-muted sm:block" title={activeBoardName}>
              / {activeBoardName}
            </span>
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fadenbrett-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Buscar…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKey}
              className="h-7 w-full rounded bg-fadenbrett-bg pl-7 pr-2 text-xs text-fadenbrett-text placeholder:text-fadenbrett-muted outline-none focus:ring-1 focus:ring-fadenbrett-accent/50 md:h-6"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-fadenbrett-muted hover:text-fadenbrett-text"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Desktop-only action bar */}
          <div className="hidden items-center gap-1.5 md:flex">
            {/* View toggle */}
            <div className="flex items-center gap-1 rounded-lg bg-fadenbrett-muted/10 p-0.5">
              <button
                onClick={() => setView('canvas')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  view === 'canvas' ? 'bg-fadenbrett-surface text-fadenbrett-text shadow' : 'text-fadenbrett-muted hover:text-fadenbrett-text'
                }`}
              >
                Canvas
              </button>
              <button
                onClick={() => setView('timeline')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  view === 'timeline' ? 'bg-fadenbrett-surface text-fadenbrett-text shadow' : 'text-fadenbrett-muted hover:text-fadenbrett-text'
                }`}
              >
                Timeline
              </button>
            </div>

            {/* Theme */}
            <div className="flex items-center gap-1 rounded-lg bg-fadenbrett-muted/10 p-0.5">
              {(['dark', 'light', 'custom'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    theme === t ? 'bg-fadenbrett-surface text-fadenbrett-text shadow' : 'text-fadenbrett-muted hover:text-fadenbrett-text'
                  }`}
                  title={t === 'dark' ? 'Tema escuro' : t === 'light' ? 'Tema claro' : 'Tema âmbar'}
                >
                  {t === 'dark' ? (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" /></svg>
                  ) : t === 'light' ? (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" /></svg>
                  )}
                </button>
              ))}
            </div>

            {/* Apresentar */}
            <button
              onClick={() => setPresentationPanelOpen((p) => !p)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                presentationPanelOpen ? 'bg-fadenbrett-accent text-white' : 'text-fadenbrett-muted hover:bg-fadenbrett-muted/10 hover:text-fadenbrett-text'
              }`}
              title="Painel de Apresentação"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              Apresentar
            </button>

            {/* Presence */}
            <PresenceBar />

            {/* Templates */}
            <button
              onClick={() => setTemplateGalleryOpen(true)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-fadenbrett-muted transition-colors hover:bg-fadenbrett-muted/10 hover:text-fadenbrett-text"
              title="Galeria de templates"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Templates
            </button>

            {/* Help / shortcuts */}
            <button
              onClick={() => setShortcutsOpen(true)}
              className="flex items-center justify-center rounded-lg px-1.5 py-1 text-xs font-medium text-fadenbrett-muted transition-colors hover:bg-fadenbrett-muted/10 hover:text-fadenbrett-text"
              title="Atalhos de teclado (?)"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
              </svg>
            </button>
          </div>

          {/* Mobile compact controls */}
          <div className="flex shrink-0 items-center gap-1 md:hidden">
            {/* Icon view toggle */}
            <div className="flex rounded-lg bg-fadenbrett-muted/10 p-0.5">
              <button
                onClick={() => setView('canvas')}
                className={`rounded-md p-1.5 transition-colors ${
                  view === 'canvas' ? 'bg-fadenbrett-surface text-fadenbrett-text shadow' : 'text-fadenbrett-muted'
                }`}
                title="Canvas"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
                </svg>
              </button>
              <button
                onClick={() => setView('timeline')}
                className={`rounded-md p-1.5 transition-colors ${
                  view === 'timeline' ? 'bg-fadenbrett-surface text-fadenbrett-text shadow' : 'text-fadenbrett-muted'
                }`}
                title="Timeline"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="3" y1="12" x2="21" y2="12" /><circle cx="7" cy="12" r="2" /><circle cx="17" cy="12" r="2" />
                </svg>
              </button>
            </div>

            {/* Vertical dots — more menu */}
            <button
              onClick={() => setMobileMenuOpen((p) => !p)}
              className={`rounded-lg p-1.5 text-fadenbrett-muted hover:bg-fadenbrett-muted/10 ${
                mobileMenuOpen ? 'bg-fadenbrett-muted/20 text-fadenbrett-text' : ''
              }`}
              title="Mais opções"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile secondary menu (⋮ revealed) */}
        {mobileMenuOpen && (
          <div className="flex flex-wrap items-center gap-2 border-t border-fadenbrett-muted/20 bg-fadenbrett-surface px-3 py-2 md:hidden">
            {/* Theme */}
            <div className="flex items-center gap-1 rounded-lg bg-fadenbrett-muted/10 p-0.5">
              {(['dark', 'light', 'custom'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    theme === t ? 'bg-fadenbrett-surface text-fadenbrett-text shadow' : 'text-fadenbrett-muted hover:text-fadenbrett-text'
                  }`}
                  title={t === 'dark' ? 'Tema escuro' : t === 'light' ? 'Tema claro' : 'Tema âmbar'}
                >
                  {t === 'dark' ? (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" /></svg>
                  ) : t === 'light' ? (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" /></svg>
                  )}
                </button>
              ))}
            </div>

            {/* Apresentar */}
            <button
              onClick={() => { setPresentationPanelOpen((p) => !p); setMobileMenuOpen(false) }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                presentationPanelOpen ? 'bg-fadenbrett-accent text-white' : 'text-fadenbrett-muted hover:bg-fadenbrett-muted/10 hover:text-fadenbrett-text'
              }`}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              Apresentar
            </button>

            {/* Presence */}
            <PresenceBar />

            {/* Templates */}
            <button
              onClick={() => { setTemplateGalleryOpen(true); setMobileMenuOpen(false) }}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-fadenbrett-muted transition-colors hover:bg-fadenbrett-muted/10 hover:text-fadenbrett-text"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Templates
            </button>

            {/* Help / shortcuts */}
            <button
              onClick={() => { setShortcutsOpen(true); setMobileMenuOpen(false) }}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-fadenbrett-muted transition-colors hover:bg-fadenbrett-muted/10 hover:text-fadenbrett-text"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
              </svg>
              Atalhos
            </button>
          </div>
        )}
      </header>

      {/* Body: sidebar + main */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="absolute inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — overlay on mobile, inline collapse on md+ */}
        <div
          className={`${
            sidebarOpen
              ? 'absolute inset-y-0 left-0 z-50 flex md:relative md:z-auto'
              : 'hidden md:flex'
          }`}
        >
          <BoardSidebar collapsed={!sidebarOpen} onToggle={() => setSidebarOpen((p) => !p)} />
        </div>

        {/* Main canvas / timeline */}
        <div className="relative flex-1 overflow-hidden">
          {view === 'canvas' ? (
            <ReactFlowProvider>
              <InvestigationCanvas />
            </ReactFlowProvider>
          ) : (
            <>
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-3">
                <FilterBar />
              </div>
              <div className="h-full overflow-hidden bg-fadenbrett-bg pt-14">
                <TimelineView />
              </div>
            </>
          )}
        </div>

        {/* Presentation panel — bottom sheet on mobile, right sidebar on md+ */}
        {presentationPanelOpen && (
          <aside className="absolute inset-x-0 bottom-0 z-30 flex max-h-[60vh] flex-col rounded-t-xl border-t border-fadenbrett-muted/20 bg-fadenbrett-surface shadow-xl md:relative md:inset-x-auto md:bottom-auto md:z-auto md:max-h-none md:w-60 md:shrink-0 md:rounded-none md:border-l md:border-t-0 md:shadow-none">
            <PresentationPanel />
          </aside>
        )}
      </div>

      {/* Template gallery modal */}
      {templateGalleryOpen && (
        <TemplateGallery
          onApply={(tpl) => {
            applyTemplate(tpl.name, tpl.nodes, tpl.edges)
            setTemplateGalleryOpen(false)
          }}
          onClose={() => setTemplateGalleryOpen(false)}
        />
      )}

      {/* Shortcuts overlay */}
      {shortcutsOpen && (
        <ShortcutsOverlay onClose={() => setShortcutsOpen(false)} />
      )}
    </div>
  )
}

