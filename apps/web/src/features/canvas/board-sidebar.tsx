import { useState, useRef } from 'react'
import { useBoardStore } from '../../store/board-store'
import type { BoardEntry } from '../../store/board-store'

interface BoardImportPayload {
  schema_version: number
  board: {
    name: string
    nodes: BoardEntry['nodes']
    edges: BoardEntry['edges']
  }
}

function isValidImport(data: unknown): data is BoardImportPayload {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  if (d.schema_version !== 1) return false
  if (!d.board || typeof d.board !== 'object') return false
  const b = d.board as Record<string, unknown>
  return Array.isArray(b.nodes) && Array.isArray(b.edges)
}

interface Props {
  collapsed: boolean
  onToggle: () => void
}

export function BoardSidebar({ collapsed, onToggle }: Props) {
  const boards = useBoardStore((s) => s.boards)
  const activeBoardId = useBoardStore((s) => s.activeBoardId)
  const nodes = useBoardStore((s) => s.nodes)
  const edges = useBoardStore((s) => s.edges)
  const createBoard = useBoardStore((s) => s.createBoard)
  const deleteBoard = useBoardStore((s) => s.deleteBoard)
  const renameBoard = useBoardStore((s) => s.renameBoard)
  const switchBoard = useBoardStore((s) => s.switchBoard)

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sortedBoards = Object.values(boards).sort((a, b) => {
    if (a.id === 'board-default') return -1
    if (b.id === 'board-default') return 1
    return a.name.localeCompare(b.name)
  })

  function handleCreate() {
    const name = prompt('Nome do novo board:')?.trim()
    if (name) createBoard(name)
  }

  function startRename(board: BoardEntry) {
    setRenamingId(board.id)
    setRenameValue(board.name)
  }

  function commitRename(id: string) {
    if (renameValue.trim()) renameBoard(id, renameValue.trim())
    setRenamingId(null)
  }

  // ── Export ──────────────────────────────────────────────────────────────
  function handleExport() {
    const activeBoard = boards[activeBoardId]
    const payload: BoardImportPayload = {
      schema_version: 1,
      board: {
        name: activeBoard.name,
        nodes,
        edges,
      },
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeBoard.name.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Import ──────────────────────────────────────────────────────────────
  function handleImportFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    if (!file) return
    ev.target.value = ''

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (!isValidImport(data)) {
          alert('Arquivo inválido ou versão incompatível.')
          return
        }
        const newId = createBoard(data.board.name || 'Board importado')
        // After createBoard the new board is active and empty — populate it
        useBoardStore.setState((state) => ({
          boards: {
            ...state.boards,
            [newId]: {
              ...state.boards[newId],
              nodes: data.board.nodes,
              edges: data.board.edges,
            },
          },
          nodes: data.board.nodes,
          edges: data.board.edges,
        }))
      } catch {
        alert('Erro ao ler o arquivo JSON.')
      }
    }
    reader.readAsText(file)
  }

  if (collapsed) {
    return (
      <div className="flex h-full w-10 flex-col items-center border-r border-fadenbrett-muted/20 bg-fadenbrett-surface pt-2">
        <button
          onClick={onToggle}
          title="Abrir sidebar"
          className="rounded p-1.5 text-fadenbrett-muted hover:text-fadenbrett-text"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full w-52 shrink-0 flex-col border-r border-fadenbrett-muted/20 bg-fadenbrett-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-fadenbrett-muted/20 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-fadenbrett-muted">Boards</span>
        <button
          onClick={onToggle}
          title="Fechar sidebar"
          className="rounded p-1 text-fadenbrett-muted hover:text-fadenbrett-text"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>
      </div>

      {/* Board list */}
      <div className="flex-1 overflow-y-auto py-1">
        {sortedBoards.map((board) => (
          <div key={board.id} className="group relative">
            {renamingId === board.id ? (
              <input
                autoFocus
                className="mx-2 my-0.5 w-[calc(100%-1rem)] rounded bg-fadenbrett-bg px-2 py-1 text-xs text-fadenbrett-text outline-none ring-1 ring-fadenbrett-accent"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => commitRename(board.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename(board.id)
                  if (e.key === 'Escape') setRenamingId(null)
                }}
              />
            ) : (
              <button
                onClick={() => switchBoard(board.id)}
                onDoubleClick={() => startRename(board)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                  board.id === activeBoardId
                    ? 'bg-fadenbrett-accent/20 text-fadenbrett-text'
                    : 'text-fadenbrett-muted hover:bg-fadenbrett-muted/10 hover:text-fadenbrett-text'
                }`}
              >
                <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18" />
                </svg>
                <span className="flex-1 truncate">{board.name}</span>
                {board.id === activeBoardId && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-fadenbrett-accent" />
                )}
              </button>
            )}

            {/* Rename / Delete actions */}
            {renamingId !== board.id && (
              <div className="absolute right-1 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 group-hover:flex">
                <button
                  onClick={() => startRename(board)}
                  title="Renomear"
                  className="rounded p-0.5 text-fadenbrett-muted hover:text-fadenbrett-text"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                {Object.keys(boards).length > 1 && (
                  <button
                    onClick={() => setConfirmDeleteId(board.id)}
                    title="Excluir"
                    className="rounded p-0.5 text-fadenbrett-muted hover:text-fadenbrett-accent"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirm delete dialog */}
      {confirmDeleteId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 rounded-lg bg-fadenbrett-surface p-4 shadow-xl">
            <p className="mb-3 text-sm text-fadenbrett-text">
              Excluir "{boards[confirmDeleteId]?.name}"? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="rounded bg-fadenbrett-muted/20 px-3 py-1 text-xs text-fadenbrett-text hover:bg-fadenbrett-muted/30"
              >
                Cancelar
              </button>
              <button
                onClick={() => { deleteBoard(confirmDeleteId); setConfirmDeleteId(null) }}
                className="rounded bg-fadenbrett-accent px-3 py-1 text-xs text-white hover:bg-fadenbrett-accent/80"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="border-t border-fadenbrett-muted/20 p-2 space-y-1">
        <button
          onClick={handleCreate}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-fadenbrett-muted hover:bg-fadenbrett-muted/10 hover:text-fadenbrett-text"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" />
          </svg>
          Novo board
        </button>
        <button
          onClick={handleExport}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-fadenbrett-muted hover:bg-fadenbrett-muted/10 hover:text-fadenbrett-text"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Exportar JSON
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-fadenbrett-muted hover:bg-fadenbrett-muted/10 hover:text-fadenbrett-text"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Importar JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>
    </div>
  )
}
