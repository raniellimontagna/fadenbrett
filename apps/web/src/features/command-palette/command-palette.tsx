import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useBoardStore } from '../../store/board-store'
import { type CardData } from '../cards/types'
import { navigateRef } from '../../lib/navigate-ref'

// ---------------------------------------------------------------------------
// Fuzzy subsequence matching — returns score 0-1 (0 = no match)
// ---------------------------------------------------------------------------

function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  if (q.length === 0) return 1
  let qi = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++
  }
  if (qi < q.length) return 0
  return qi / t.length
}

// ---------------------------------------------------------------------------
// Command types
// ---------------------------------------------------------------------------

interface Command {
  id: string
  category: 'card' | 'board' | 'action'
  label: string
  sublabel?: string
  shortcut?: string
  action: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  onClose: () => void
  onSetView?: (view: 'canvas' | 'timeline') => void
  onTogglePresentation?: () => void
  onOpenTemplates?: () => void
  onOpenShortcuts?: () => void
}

export function CommandPalette({
  onClose,
  onSetView,
  onTogglePresentation,
  onOpenTemplates,
  onOpenShortcuts,
}: Props) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const nodes = useBoardStore((s) => s.nodes)
  const boards = useBoardStore((s) => s.boards)
  const activeBoardId = useBoardStore((s) => s.activeBoardId)
  const switchBoard = useBoardStore((s) => s.switchBoard)
  const selectCard = useBoardStore((s) => s.selectCard)
  const setTheme = useBoardStore((s) => s.setTheme)
  const clearFilters = useBoardStore((s) => s.clearFilters)
  const undo = useBoardStore((s) => s.undo)
  const redo = useBoardStore((s) => s.redo)
  const saveNow = useBoardStore((s) => s.saveNow)
  const startPresentation = useBoardStore((s) => s.startPresentation)
  const presentationActive = useBoardStore((s) => s.presentationActive)
  const exitPresentation = useBoardStore((s) => s.exitPresentation)
  const collaborating = useBoardStore((s) => s.collaborating)
  const startCollab = useBoardStore((s) => s.startCollab)
  const stopCollab = useBoardStore((s) => s.stopCollab)

  // Build commands list
  const commands = useMemo<Command[]>(() => {
    const cmds: Command[] = []

    // Cards from active board
    const cardNodes = nodes.filter((n) => n.type === 'card')
    for (const node of cardNodes) {
      const data = node.data as unknown as CardData
      cmds.push({
        id: `card-${node.id}`,
        category: 'card',
        label: data.title || 'Card sem título',
        sublabel: [data.eraLabel, ...(data.tags || [])].filter(Boolean).join(' · ') || undefined,
        action: () => {
          selectCard(node.id)
          navigateRef.current?.(node.id)
        },
      })
    }

    // Boards
    for (const [id, board] of Object.entries(boards)) {
      if (id === activeBoardId) continue
      cmds.push({
        id: `board-${id}`,
        category: 'board',
        label: board.name,
        sublabel: board.description || undefined,
        action: () => switchBoard(id),
      })
    }

    // Actions
    const actions: Array<{ label: string; shortcut?: string; action: () => void }> = [
      { label: 'Salvar agora', shortcut: 'Ctrl+S', action: saveNow },
      { label: 'Desfazer', shortcut: 'Ctrl+Z', action: undo },
      { label: 'Refazer', shortcut: 'Ctrl+Shift+Z', action: redo },
      { label: 'Limpar filtros', action: clearFilters },
      { label: 'Tema: Dark', action: () => setTheme('dark') },
      { label: 'Tema: Light', action: () => setTheme('light') },
      { label: 'Tema: Custom', action: () => setTheme('custom') },
    ]

    if (onSetView) {
      actions.push(
        { label: 'Ver: Canvas', action: () => onSetView('canvas') },
        { label: 'Ver: Timeline', action: () => onSetView('timeline') },
      )
    }

    if (onTogglePresentation) {
      actions.push({
        label: presentationActive ? 'Sair da apresentação' : 'Iniciar apresentação',
        action: presentationActive ? exitPresentation : startPresentation,
      })
    }

    actions.push({
      label: collaborating ? 'Parar colaboração' : 'Iniciar colaboração',
      action: collaborating ? stopCollab : startCollab,
    })

    if (onOpenTemplates) {
      actions.push({ label: 'Abrir templates', action: onOpenTemplates })
    }

    if (onOpenShortcuts) {
      actions.push({ label: 'Ver atalhos de teclado', shortcut: '?', action: onOpenShortcuts })
    }

    for (const a of actions) {
      cmds.push({
        id: `action-${a.label}`,
        category: 'action',
        label: a.label,
        shortcut: a.shortcut,
        action: a.action,
      })
    }

    return cmds
  }, [
    nodes, boards, activeBoardId, switchBoard, selectCard, setTheme,
    clearFilters, undo, redo, saveNow, presentationActive, startPresentation,
    exitPresentation, collaborating, startCollab, stopCollab,
    onSetView, onTogglePresentation, onOpenTemplates, onOpenShortcuts,
  ])

  // Filter & score
  const filtered = useMemo(() => {
    if (!query.trim()) {
      // Show actions first, then boards, then first 5 cards
      const actions = commands.filter((c) => c.category === 'action')
      const boardCmds = commands.filter((c) => c.category === 'board')
      const cards = commands.filter((c) => c.category === 'card').slice(0, 5)
      return [...actions, ...boardCmds, ...cards]
    }

    const scored = commands
      .map((cmd) => {
        const labelScore = fuzzyScore(query, cmd.label)
        const sublabelScore = cmd.sublabel ? fuzzyScore(query, cmd.sublabel) * 0.7 : 0
        return { cmd, score: Math.max(labelScore, sublabelScore) }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)

    return scored.map((s) => s.cmd)
  }, [query, commands])

  // Reset selection on filter change (setState during render — React recommended pattern)
  const [prevFilteredLen, setPrevFilteredLen] = useState(filtered.length)
  if (prevFilteredLen !== filtered.length) {
    setPrevFilteredLen(filtered.length)
    setSelectedIndex(0)
  }

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const execute = useCallback(
    (cmd: Command) => {
      onClose()
      // Defer action to after modal closes
      requestAnimationFrame(() => cmd.action())
    },
    [onClose],
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault()
        execute(filtered[selectedIndex])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    },
    [filtered, selectedIndex, execute, onClose],
  )

  const categoryLabel = (cat: Command['category']) => {
    switch (cat) {
      case 'card': return 'Cards'
      case 'board': return 'Boards'
      case 'action': return 'Ações'
    }
  }

  const categoryIcon = (cat: Command['category']) => {
    switch (cat) {
      case 'card':
        return <path d="M16 4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM10 10h4M10 14h2" />
      case 'board':
        return <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
      case 'action':
        return <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    }
  }

  // Group by category for rendering
  const grouped = useMemo(() => {
    const groups: Array<{ category: Command['category']; items: Array<{ cmd: Command; globalIndex: number }> }> = []
    let currentCat: Command['category'] | null = null
    let globalIdx = 0
    for (const cmd of filtered) {
      if (cmd.category !== currentCat) {
        currentCat = cmd.category
        groups.push({ category: cmd.category, items: [] })
      }
      groups[groups.length - 1].items.push({ cmd, globalIndex: globalIdx })
      globalIdx++
    }
    return groups
  }, [filtered])

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-start justify-center bg-black/60 pt-[15vh] backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-fadenbrett-muted/30 bg-fadenbrett-surface shadow-2xl"
        onKeyDown={onKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-fadenbrett-muted/20 px-3 py-2.5">
          <svg className="h-4 w-4 shrink-0 text-fadenbrett-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cards, boards, ações…"
            className="flex-1 bg-transparent text-sm text-fadenbrett-text outline-none placeholder:text-fadenbrett-muted/60"
            autoFocus
          />
          <kbd className="hidden rounded border border-fadenbrett-muted/30 px-1.5 py-0.5 text-[10px] text-fadenbrett-muted sm:inline">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-1.5" role="listbox">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-fadenbrett-muted">
              Nenhum resultado para &ldquo;{query}&rdquo;
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.category}>
                <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-fadenbrett-muted">
                  {categoryLabel(group.category)}
                </div>
                {group.items.map(({ cmd, globalIndex }) => (
                  <button
                    key={cmd.id}
                    role="option"
                    aria-selected={globalIndex === selectedIndex}
                    data-active={globalIndex === selectedIndex}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                      globalIndex === selectedIndex
                        ? 'bg-fadenbrett-accent/15 text-fadenbrett-text'
                        : 'text-fadenbrett-muted hover:bg-fadenbrett-muted/10 hover:text-fadenbrett-text'
                    }`}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    onClick={() => execute(cmd)}
                  >
                    <svg className="h-4 w-4 shrink-0 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      {categoryIcon(cmd.category)}
                    </svg>
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{cmd.label}</div>
                      {cmd.sublabel && (
                        <div className="truncate text-[11px] text-fadenbrett-muted">{cmd.sublabel}</div>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <kbd className="shrink-0 rounded border border-fadenbrett-muted/20 px-1.5 py-0.5 text-[10px] text-fadenbrett-muted">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 border-t border-fadenbrett-muted/20 px-3 py-1.5 text-[10px] text-fadenbrett-muted">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-fadenbrett-muted/20 px-1 py-0.5">↑↓</kbd>
            navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-fadenbrett-muted/20 px-1 py-0.5">↵</kbd>
            executar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-fadenbrett-muted/20 px-1 py-0.5">esc</kbd>
            fechar
          </span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
