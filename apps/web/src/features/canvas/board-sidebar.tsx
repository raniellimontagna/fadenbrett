import { useState, useRef } from 'react'
import { useBoardStore } from '../../store/board-store'
import type { BoardEntry } from '../../store/board-store'

// ── Constants ──────────────────────────────────────────────────────────────

const BOARD_COLORS = [
  '#b91c1c', // red  (roter Faden accent)
  '#2563eb', // blue
  '#059669', // emerald
  '#7c3aed', // violet
  '#d97706', // amber
  '#0d9488', // teal
  '#db2777', // pink
  '#6b7280', // gray
]

// ── BoardModal ─────────────────────────────────────────────────────────────

interface BoardModalProps {
  title: string
  initial: { name: string; description: string; color: string }
  onSave: (data: { name: string; description: string; color: string }) => void
  onCancel: () => void
}

function BoardModal({ title, initial, onSave, onCancel }: BoardModalProps) {
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [color, setColor] = useState(initial.color)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onCancel}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) onSave({ name: name.trim(), description: description.slice(0, 200), color })
        }}
        className="w-full rounded-t-2xl border-t border-fadenbrett-muted/30 bg-fadenbrett-surface p-4 shadow-xl sm:w-80 sm:rounded-lg sm:border"
      >
        <h2 className="mb-4 text-sm font-semibold text-fadenbrett-text">{title}</h2>

        {/* Name */}
        <div className="mb-3">
          <label className="mb-1 block text-xs text-fadenbrett-muted">Nome</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do board…"
            className="w-full rounded border border-fadenbrett-muted/30 bg-fadenbrett-bg px-2 py-1.5 text-sm text-fadenbrett-text outline-none focus:border-fadenbrett-accent"
          />
        </div>

        {/* Description */}
        <div className="mb-3">
          <label className="mb-1 flex items-center justify-between text-xs text-fadenbrett-muted">
            <span>Descrição</span>
            <span>{description.length}/200</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contexto do board… (opcional)"
            maxLength={200}
            rows={2}
            className="w-full resize-none rounded border border-fadenbrett-muted/30 bg-fadenbrett-bg px-2 py-1.5 text-sm text-fadenbrett-text outline-none focus:border-fadenbrett-accent"
          />
        </div>

        {/* Color picker */}
        <div className="mb-4">
          <label className="mb-2 block text-xs text-fadenbrett-muted">Cor de identificação</label>
          <div className="flex flex-wrap gap-2">
            {/* "None" option */}
            <button
              type="button"
              onClick={() => setColor('')}
              title="Sem cor"
              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 bg-fadenbrett-bg transition-transform ${
                color === '' ? 'scale-125 border-white' : 'border-fadenbrett-muted/40 hover:scale-110'
              }`}
            >
              <svg className="h-3 w-3 text-fadenbrett-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            {BOARD_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(color === c ? '' : c)}
                className={`h-6 w-6 rounded-full border-2 transition-transform ${
                  color === c ? 'scale-125 border-white' : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 rounded bg-fadenbrett-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-fadenbrett-accent/80 disabled:opacity-50"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded border border-fadenbrett-muted/30 px-3 py-1.5 text-xs text-fadenbrett-muted hover:bg-fadenbrett-muted/10"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

// ── BoardSidebar ───────────────────────────────────────────────────────────

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
  const createBoard = useBoardStore((s) => s.createBoard)
  const duplicateBoard = useBoardStore((s) => s.duplicateBoard)
  const deleteBoard = useBoardStore((s) => s.deleteBoard)
  const updateBoardMeta = useBoardStore((s) => s.updateBoardMeta)
  const switchBoard = useBoardStore((s) => s.switchBoard)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalBoardId, setEditModalBoardId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sortedBoards = Object.values(boards).sort((a, b) => {
    if (a.id === 'board-default') return -1
    if (b.id === 'board-default') return 1
    return a.name.localeCompare(b.name)
  })

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

  // ── Collapsed view ───────────────────────────────────────────────────────
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

  const editingBoard = editModalBoardId ? boards[editModalBoardId] : null

  return (
    <div className="relative flex h-full w-52 shrink-0 flex-col border-r border-fadenbrett-muted/20 bg-fadenbrett-surface">
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
            <button
              onClick={() => switchBoard(board.id)}
              title={board.description || board.name}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                board.id === activeBoardId
                  ? 'bg-fadenbrett-accent/20 text-fadenbrett-text'
                  : 'text-fadenbrett-muted hover:bg-fadenbrett-muted/10 hover:text-fadenbrett-text'
              }`}
            >
              {/* Color indicator or default icon */}
              {board.color ? (
                <span
                  className="h-4 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: board.color }}
                />
              ) : (
                <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18" />
                </svg>
              )}
              <span className="flex-1 truncate">{board.name}</span>
              {board.id === activeBoardId && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-fadenbrett-accent" />
              )}
            </button>

            {/* Description subtitle */}
            {board.description && (
              <p className="line-clamp-1 px-3 pb-0.5 text-[10px] leading-tight text-fadenbrett-muted/60">
                {board.description}
              </p>
            )}

            {/* Edit / Delete actions */}
            <div className="absolute right-1 top-1 hidden items-center gap-0.5 group-hover:flex">
              <button
                onClick={(e) => { e.stopPropagation(); duplicateBoard(board.id) }}
                title="Duplicar board"
                className="rounded p-0.5 text-fadenbrett-muted hover:text-fadenbrett-text"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
              <button
                onClick={() => setEditModalBoardId(board.id)}
                title="Editar board"
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
      <div className="space-y-1 border-t border-fadenbrett-muted/20 p-2">
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-fadenbrett-muted hover:bg-fadenbrett-muted/10 hover:text-fadenbrett-text"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" />
          </svg>
          Novo board
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

      {/* Create board modal */}
      {createModalOpen && (
        <BoardModal
          title="Novo board"
          initial={{ name: '', description: '', color: '' }}
          onSave={({ name, description, color }) => {
            createBoard(name, description, color)
            setCreateModalOpen(false)
          }}
          onCancel={() => setCreateModalOpen(false)}
        />
      )}

      {/* Edit board modal */}
      {editModalBoardId && editingBoard && (
        <BoardModal
          title="Editar board"
          initial={{
            name: editingBoard.name,
            description: editingBoard.description ?? '',
            color: editingBoard.color ?? '',
          }}
          onSave={({ name, description, color }) => {
            updateBoardMeta(editModalBoardId, { name, description, color })
            setEditModalBoardId(null)
          }}
          onCancel={() => setEditModalBoardId(null)}
        />
      )}
    </div>
  )
}
