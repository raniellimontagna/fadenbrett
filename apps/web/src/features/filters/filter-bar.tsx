import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useBoardStore, type ActiveFilters } from '../../store/board-store'
import { type CardData } from '../cards/types'
import { CONNECTION_STYLES } from '../connections/types'

function hasActiveFilters(f: ActiveFilters): boolean {
  return f.groups.length > 0 || f.tags.length > 0 || f.eras.length > 0 || f.connectionStyles.length > 0
}

type OpenMenu = 'groups' | 'tags' | 'eras' | 'connections' | null

// ── Dropdown container with click-outside close ──────────────────────────────
function Dropdown({ onClose, children, position = 'bottom' }: { onClose: () => void; children: React.ReactNode; position?: 'top' | 'bottom' }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const positionClasses = position === 'top' 
    ? 'bottom-full mb-1.5' 
    : 'top-full mt-1.5'

  return (
    <div
      ref={ref}
      className={`absolute left-0 z-50 min-w-[180px] max-w-[240px] rounded-xl border border-fadenbrett-muted/20 bg-fadenbrett-surface shadow-xl ${positionClasses}`}
    >
      {children}
    </div>
  )
}

// ── Pill button ───────────────────────────────────────────────────────────────
interface PillProps {
  label: string
  activeCount: number
  open: boolean
  onClick: () => void
  children?: React.ReactNode
  dropdownPosition?: 'top' | 'bottom'
}

function FilterPill({ label, activeCount, open, onClick, children, dropdownPosition }: PillProps) {
  return (
    <div className="relative shrink-0">
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={onClick}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
          activeCount > 0
            ? 'border-fadenbrett-accent bg-fadenbrett-accent/15 text-fadenbrett-accent'
            : open
              ? 'border-fadenbrett-muted/40 bg-fadenbrett-muted/20 text-fadenbrett-text'
              : 'border-fadenbrett-muted/20 bg-transparent text-fadenbrett-muted hover:border-fadenbrett-muted/40 hover:text-fadenbrett-text'
        }`}
      >
        {label}
        {activeCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-fadenbrett-accent px-1 text-[10px] font-bold text-white leading-none">
            {activeCount}
          </span>
        )}
        <svg
          className={`h-3 w-3 transition-transform ${open ? (dropdownPosition === 'top' ? 'rotate-0' : 'rotate-180') : (dropdownPosition === 'top' ? 'rotate-180' : '0')}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && children}
    </div>
  )
}

// ── Main FilterBar ─────────────────────────────────────────────────────────────
export function FilterBar() {
  const { nodes, edges, activeFilters, toggleFilter, clearFilters } = useBoardStore()
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const dropdownPosition = isMobile ? 'top' : 'bottom'

  const cardNodes = useMemo(
    () => nodes.filter((n) => n.type === 'card').map((n) => n.data as unknown as CardData),
    [nodes],
  )

  const availableGroups = useMemo(
    () => Array.from(new Set(cardNodes.map((c) => c.groupColor).filter(Boolean))),
    [cardNodes],
  )

  const availableTags = useMemo(
    () => Array.from(new Set(cardNodes.flatMap((c) => c.tags).filter(Boolean))).sort(),
    [cardNodes],
  )

  const availableEras = useMemo(
    () => Array.from(new Set(cardNodes.map((c) => c.eraLabel).filter(Boolean))).sort(),
    [cardNodes],
  )

  const hasEdges = edges.length > 0
  const isActive = hasActiveFilters(activeFilters)

  const toggle = useCallback((menu: OpenMenu) => {
    setOpenMenu((prev) => (prev === menu ? null : menu))
  }, [])

  const close = useCallback(() => setOpenMenu(null), [])

  if (availableGroups.length === 0 && availableTags.length === 0 && availableEras.length === 0 && !hasEdges) {
    return null
  }

  return (
    <nav
      className="pointer-events-auto absolute bottom-16 sm:bottom-auto sm:top-3 left-1/2 z-10 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-fit rounded-xl border border-fadenbrett-muted/20 bg-fadenbrett-surface/90 shadow-lg backdrop-blur-sm"
      onMouseDown={(e) => e.stopPropagation()}
      aria-label="Filtros do board"
    >
      <div className="flex items-center gap-1.5 overflow-x-auto px-2 py-1.5 scrollbar-none">
      {/* ── Grupo ── */}
      {availableGroups.length > 0 && (
        <FilterPill
          label="Grupo"
          activeCount={activeFilters.groups.length}
          open={openMenu === 'groups'}
          onClick={() => toggle('groups')}
          dropdownPosition={dropdownPosition}
        >
          <Dropdown onClose={close} position={dropdownPosition}>
            <div className="p-2">
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-fadenbrett-muted">
                Cor do grupo
              </p>
              <div className="flex flex-wrap gap-2 px-1">
                {availableGroups.map((color) => {
                  const active = activeFilters.groups.includes(color)
                  return (
                    <button
                      key={color}
                      title={color}
                      onClick={() => toggleFilter('groups', color)}
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                        active ? 'scale-125 border-white shadow' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {active && (
                        <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </Dropdown>
        </FilterPill>
      )}

      {/* ── Tags ── */}
      {availableTags.length > 0 && (
        <FilterPill
          label={`Tag (${availableTags.length})`}
          activeCount={activeFilters.tags.length}
          open={openMenu === 'tags'}
          onClick={() => toggle('tags')}
          dropdownPosition={dropdownPosition}
        >
          <Dropdown onClose={close} position={dropdownPosition}>
            <div className="flex max-h-56 flex-col overflow-hidden">
              <p className="shrink-0 px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-fadenbrett-muted">
                Tags
              </p>
              <div className="overflow-y-auto px-2 pb-2">
                {availableTags.map((tag) => {
                  const active = activeFilters.tags.includes(tag)
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleFilter('tags', tag)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                        active
                          ? 'bg-fadenbrett-accent/20 text-fadenbrett-accent'
                          : 'text-fadenbrett-muted hover:bg-fadenbrett-muted/10 hover:text-fadenbrett-text'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? 'bg-fadenbrett-accent' : 'bg-fadenbrett-muted/40'}`}
                      />
                      {tag}
                      {active && (
                        <svg className="ml-auto h-3 w-3 shrink-0 text-fadenbrett-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </Dropdown>
        </FilterPill>
      )}

      {/* ── Era ── */}
      {availableEras.length > 0 && (
        <FilterPill
          label={`Era (${availableEras.length})`}
          activeCount={activeFilters.eras.length}
          open={openMenu === 'eras'}
          onClick={() => toggle('eras')}
          dropdownPosition={dropdownPosition}
        >
          <Dropdown onClose={close} position={dropdownPosition}>
            <div className="flex max-h-56 flex-col overflow-hidden">
              <p className="shrink-0 px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-fadenbrett-muted">
                Era / Período
              </p>
              <div className="overflow-y-auto px-2 pb-2">
                {availableEras.map((era) => {
                  const active = activeFilters.eras.includes(era)
                  return (
                    <button
                      key={era}
                      onClick={() => toggleFilter('eras', era)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                        active
                          ? 'bg-fadenbrett-accent/20 text-fadenbrett-accent'
                          : 'text-fadenbrett-muted hover:bg-fadenbrett-muted/10 hover:text-fadenbrett-text'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? 'bg-fadenbrett-accent' : 'bg-fadenbrett-muted/40'}`}
                      />
                      {era}
                      {active && (
                        <svg className="ml-auto h-3 w-3 shrink-0 text-fadenbrett-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </Dropdown>
        </FilterPill>
      )}

      {/* ── Conexão ── */}
      {hasEdges && (
        <FilterPill
          label="Conexão"
          activeCount={activeFilters.connectionStyles.length}
          open={openMenu === 'connections'}
          onClick={() => toggle('connections')}
          dropdownPosition={dropdownPosition}
        >
          <Dropdown onClose={close} position={dropdownPosition}>
            <div className="p-2">
              <p className="mb-1 px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-fadenbrett-muted">
                Estilo
              </p>
              {CONNECTION_STYLES.map(({ value, label }) => {
                const active = activeFilters.connectionStyles.includes(value)
                return (
                  <button
                    key={value}
                    onClick={() => toggleFilter('connectionStyles', value)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                      active
                        ? 'bg-fadenbrett-accent/20 text-fadenbrett-accent'
                        : 'text-fadenbrett-muted hover:bg-fadenbrett-muted/10 hover:text-fadenbrett-text'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? 'bg-fadenbrett-accent' : 'bg-fadenbrett-muted/40'}`}
                    />
                    {label}
                    {active && (
                      <svg className="ml-auto h-3 w-3 shrink-0 text-fadenbrett-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </Dropdown>
        </FilterPill>
      )}

      {/* ── Clear all ── */}
      {isActive && (
        <>
          <div className="h-4 w-px shrink-0 bg-fadenbrett-muted/20" />
          <button
            onClick={clearFilters}
            className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-fadenbrett-muted transition-colors hover:bg-fadenbrett-muted/10 hover:text-fadenbrett-text"
            title="Limpar todos os filtros"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
            Limpar
          </button>
        </>
      )}
      </div>
    </nav>
  )
}
