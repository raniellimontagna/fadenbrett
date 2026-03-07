import {
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react'
import { create } from 'zustand'
import { generateId } from '../utils/uuid.js'
import { type CardData, DEFAULT_CARD_DATA } from '../features/cards/types'
import { type ConnectionData, DEFAULT_CONNECTION_DATA, type ConnectionStyle } from '../features/connections/types'
import { type NoteData, DEFAULT_NOTE_DATA, NOTE_COLORS } from '../features/notes/types'
import { type FrameData, DEFAULT_FRAME_DATA } from '../features/frames/types'
import { type PresentationStop } from '../features/presentation/types'
import { type CollabUser, generateUser } from '../features/collab/types'
import { collabChannel } from '../features/collab/channel'
import {
  apiListBoards,
  apiCreateBoard,
  apiRenameBoard,
  apiDeleteBoard,
  apiAutosave,
  type ApiBoard,
} from '../lib/api-client'

// ---------------------------------------------------------------------------
// Lightweight localStorage helpers (preferences only — board data lives in API)
// ---------------------------------------------------------------------------

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function lsSet<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Debounce helper
// ---------------------------------------------------------------------------

function makeDebounced<T extends (...args: never[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null
  const run = (...args: Parameters<T>) => {
    lastArgs = args
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...(lastArgs as Parameters<T>))
      lastArgs = null
      timer = null
    }, ms)
  }
  run.flush = () => {
    if (timer !== null && lastArgs !== null) {
      clearTimeout(timer)
      fn(...lastArgs)
      lastArgs = null
      timer = null
    }
  }
  return run
}

// ---------------------------------------------------------------------------
// Initialise preferences from localStorage (before React renders)
// ---------------------------------------------------------------------------

const initTheme = lsGet<'dark' | 'light' | 'custom'>('fadenbrett-theme', 'dark')
const initUser = lsGet<CollabUser | null>('fadenbrett-user', null) ?? generateUser()
const initPresentationStops = lsGet<PresentationStop[]>('fadenbrett-presentation', [])
const initActiveBoardId = lsGet<string>('fadenbrett-active-board', 'board-default')

// Apply theme immediately (before React renders)
document.documentElement.setAttribute('data-theme', initTheme)

// ---------------------------------------------------------------------------
// Debounced autosave to API (fires on nodes/edges changes)
// ---------------------------------------------------------------------------

const debouncedApiSave = makeDebounced(
  (boardId: string, nodes: Node[], edges: Edge[]) => {
    apiAutosave(boardId, { nodes, edges }).catch(() => {/* silent */})
  },
  1500,
)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BoardEntry {
  id: string
  name: string
  nodes: Node[]
  edges: Edge[]
}

export interface ActiveFilters {
  groups: string[]
  tags: string[]
  eras: string[]
  connectionStyles: ConnectionStyle[]
}

const EMPTY_FILTERS: ActiveFilters = { groups: [], tags: [], eras: [], connectionStyles: [] }

const DEFAULT_BOARD_ID = 'board-default'

function makeBoard(name = 'Board 1', id = DEFAULT_BOARD_ID): BoardEntry {
  return { id, name, nodes: [], edges: [] }
}

// ---------------------------------------------------------------------------
// Parsed snapshot helper
// ---------------------------------------------------------------------------

function snapshotToBoard(apiBoard: ApiBoard, id: string, name: string): BoardEntry {
  if (!apiBoard.snapshot) return makeBoard(name, id)
  try {
    const parsed = JSON.parse(apiBoard.snapshot) as { nodes?: Node[]; edges?: Edge[] }
    return { id, name, nodes: parsed.nodes ?? [], edges: parsed.edges ?? [] }
  } catch {
    return makeBoard(name, id)
  }
}

export type ApiStatus = 'idle' | 'loading' | 'connected' | 'error'

export interface BoardState {
  // API connection status
  apiStatus: ApiStatus
  apiError: string | null
  loadBoards: () => Promise<void>
  // Multi-board
  boards: Record<string, BoardEntry>
  activeBoardId: string
  createBoard: (name: string) => string
  deleteBoard: (id: string) => void
  renameBoard: (id: string, name: string) => void
  switchBoard: (id: string) => void
  // Active board data (mirrors boards[activeBoardId])
  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  addCard: (position: { x: number; y: number }, data?: Partial<Omit<CardData, 'id'>>) => string
  updateCard: (id: string, data: Partial<Omit<CardData, 'id'>>) => void
  deleteCard: (id: string) => void
  getCard: (id: string) => CardData | undefined
  addNote: (position: { x: number; y: number }, data?: Partial<Omit<NoteData, 'id'>>) => string
  updateNote: (id: string, data: Partial<Omit<NoteData, 'id'>>) => void
  deleteNote: (id: string) => void
  getNote: (id: string) => NoteData | undefined
  // Frame / group
  addFrame: (position: { x: number; y: number }, childNodeIds?: string[]) => string
  updateFrame: (id: string, data: Partial<Omit<FrameData, 'id'>>) => void
  deleteFrame: (id: string) => void
  updateConnection: (id: string, data: Partial<ConnectionData>) => void
  deleteConnection: (id: string) => void
  getConnection: (id: string) => (ConnectionData & { id: string }) | undefined
  // Selection / Detail panel
  selectedCardId: string | null
  selectCard: (id: string | null) => void
  // Filters
  activeFilters: ActiveFilters
  toggleFilter: <K extends keyof ActiveFilters>(key: K, value: ActiveFilters[K][number]) => void
  clearFilters: () => void
  // Persistence
  lastSavedAt: Date | null
  saveNow: () => void
  // Search
  searchQuery: string
  setSearchQuery: (q: string) => void
  searchResultIndex: number
  setSearchResultIndex: (i: number) => void
  // Undo / Redo
  past: Array<{ nodes: Node[]; edges: Edge[] }>
  future: Array<{ nodes: Node[]; edges: Edge[] }>
  pushHistory: () => void
  undo: () => void
  redo: () => void
  // Theme
  theme: 'dark' | 'light' | 'custom'
  setTheme: (t: 'dark' | 'light' | 'custom') => void
  // Presentation
  presentationStops: PresentationStop[]
  presentationActive: boolean
  presentationIndex: number
  addPresentationStop: (nodeId: string, label?: string) => void
  removePresentationStop: (stopId: string) => void
  movePresentationStop: (stopId: string, direction: 'up' | 'down') => void
  updatePresentationStopLabel: (stopId: string, label: string) => void
  startPresentation: () => void
  exitPresentation: () => void
  nextStop: () => void
  prevStop: () => void
  // Collaboration
  localUser: CollabUser
  remoteUsers: Record<string, CollabUser>
  collaborating: boolean
  startCollab: () => void
  stopCollab: () => void
  sendCursorMove: (cursor: { x: number; y: number }) => void
  setLocalUserName: (name: string) => void
  // Clipboard (copy/paste)
  clipboard: { nodes: Node[]; edges: Edge[] } | null
  copySelected: () => void
  pasteClipboard: () => void
  duplicateNodes: (nodeIds: string[]) => void
  // Templates
  applyTemplate: (name: string, nodes: Node[], edges: Edge[]) => void
}

export const useBoardStore = create<BoardState>()((set, get) => ({
  // --- API Status ---
  apiStatus: 'idle' as ApiStatus,
  apiError: null,

  loadBoards: async () => {
    set({ apiStatus: 'loading', apiError: null })
    try {
      const boards = await apiListBoards()

      if (boards.length === 0) {
        // No boards on server yet — create default
        const nb = await apiCreateBoard('Board 1')
        const entry = snapshotToBoard(nb, nb.id, nb.name)
        set({ apiStatus: 'connected', boards: { [entry.id]: entry }, activeBoardId: entry.id, nodes: entry.nodes, edges: entry.edges })
        lsSet('fadenbrett-active-board', entry.id)
        return
      }

      const boardMap: Record<string, BoardEntry> = {}
      for (const b of boards) {
        boardMap[b.id] = snapshotToBoard(b, b.id, b.name)
      }

      const savedActiveId = initActiveBoardId
      const activeId = boardMap[savedActiveId] ? savedActiveId : boards[0].id
      const active = boardMap[activeId]

      set({ apiStatus: 'connected', boards: boardMap, activeBoardId: activeId, nodes: active.nodes, edges: active.edges })
      lsSet('fadenbrett-active-board', activeId)
    } catch (err) {
      set({ apiStatus: 'error', apiError: err instanceof Error ? err.message : 'Erro ao conectar à API' })
    }
  },

  // --- Multi-board ---
  boards: { 'board-default': makeBoard() },
  activeBoardId: initActiveBoardId,

  createBoard: (name) => {
    const id = `board-${generateId()}`
    const state = get()
    const updatedBoards = {
      ...state.boards,
      [state.activeBoardId]: { ...state.boards[state.activeBoardId], nodes: state.nodes, edges: state.edges },
      [id]: makeBoard(name, id),
    }
    set({ boards: updatedBoards, activeBoardId: id, nodes: [], edges: [], selectedCardId: null, activeFilters: EMPTY_FILTERS })
    lsSet('fadenbrett-active-board', id)
    apiCreateBoard(name, id).catch(() => {/* ignore */})
    return id
  },

  deleteBoard: (id) => {
    const state = get()
    const ids = Object.keys(state.boards).filter((k) => k !== id)
    if (ids.length === 0) return
    const updatedBoards = { ...state.boards }
    delete updatedBoards[id]
    const nextId = state.activeBoardId === id ? ids[0] : state.activeBoardId
    const next = updatedBoards[nextId]
    set({ boards: updatedBoards, activeBoardId: nextId, nodes: next.nodes, edges: next.edges, selectedCardId: null, activeFilters: EMPTY_FILTERS })
    lsSet('fadenbrett-active-board', nextId)
    apiDeleteBoard(id).catch(() => {/* ignore */})
  },

  renameBoard: (id, name) => {
    const state = get()
    set({ boards: { ...state.boards, [id]: { ...state.boards[id], name } } })
    apiRenameBoard(id, name).catch(() => {/* ignore */})
  },

  switchBoard: (id) => {
    const state = get()
    if (id === state.activeBoardId) return
    const updatedBoards = {
      ...state.boards,
      [state.activeBoardId]: { ...state.boards[state.activeBoardId], nodes: state.nodes, edges: state.edges },
    }
    const next = updatedBoards[id]
    set({ boards: updatedBoards, activeBoardId: id, nodes: next.nodes, edges: next.edges, selectedCardId: null, activeFilters: EMPTY_FILTERS })
    lsSet('fadenbrett-active-board', id)
    // Reconnect WebSocket to the new board's room when collaborating
    if (state.collaborating) collabChannel.open(id)
  },

  // --- Active board data ---
  nodes: [],
  edges: [],

  onNodesChange: (changes) => {
    const hasDragEnd = changes.some((c) => c.type === 'position' && c.dragging === false)
    if (hasDragEnd) get().pushHistory()
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),

  onConnect: (connection) => {
    get().pushHistory()
    const edge: Edge = {
      id: `e-${generateId()}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'yarn',
      data: { ...DEFAULT_CONNECTION_DATA } as unknown as Record<string, unknown>,
    }
    set({ edges: [...get().edges, edge] })
  },

  addCard: (position, data) => {
    get().pushHistory()
    const id = generateId()
    const node: Node = {
      id, type: 'card', position,
      data: { ...DEFAULT_CARD_DATA, ...data, id } as unknown as Record<string, unknown>,
    }
    set({ nodes: [...get().nodes, node] })
    return id
  },

  updateCard: (id, data) => {
    get().pushHistory()
    set({ nodes: get().nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n) })
  },

  deleteCard: (id) => {
    get().pushHistory()
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
    })
  },

  getCard: (id) => {
    const n = get().nodes.find((n) => n.id === id)
    return n?.data as CardData | undefined
  },

  addNote: (position, data) => {
    get().pushHistory()
    const id = generateId()
    const rotation = (Math.random() - 0.5) * 6
    const color = data?.color ?? NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
    const node: Node = {
      id, type: 'note', position,
      data: { ...DEFAULT_NOTE_DATA, ...data, color, rotation, id } as unknown as Record<string, unknown>,
    }
    set({ nodes: [...get().nodes, node] })
    return id
  },

  updateNote: (id, data) => {
    get().pushHistory()
    set({ nodes: get().nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n) })
  },

  deleteNote: (id) => {
    get().pushHistory()
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
    })
  },

  getNote: (id) => {
    const n = get().nodes.find((n) => n.id === id)
    return n?.data as NoteData | undefined
  },

  addFrame: (position, childNodeIds) => {
    get().pushHistory()
    const id = `frame-${generateId()}`
    const PADDING = 32

    let frameX = position.x
    let frameY = position.y
    let frameW = DEFAULT_FRAME_DATA.width
    let frameH = DEFAULT_FRAME_DATA.height

    const currentNodes = get().nodes

    if (childNodeIds && childNodeIds.length > 0) {
      const children = currentNodes.filter((n) => childNodeIds.includes(n.id))
      if (children.length > 0) {
        const xs = children.map((n) => n.position.x)
        const ys = children.map((n) => n.position.y)
        const minX = Math.min(...xs) - PADDING
        const minY = Math.min(...ys) - PADDING
        const maxX = Math.max(...children.map((n) => n.position.x + (n.measured?.width ?? 224)))
        const maxY = Math.max(...children.map((n) => n.position.y + (n.measured?.height ?? 120)))
        frameX = minX
        frameY = minY
        frameW = maxX - minX + PADDING
        frameH = maxY - minY + PADDING
      }
    }

    const frameNode: Node = {
      id,
      type: 'frame',
      position: { x: frameX, y: frameY },
      data: { ...DEFAULT_FRAME_DATA, id, width: frameW, height: frameH } as unknown as Record<string, unknown>,
      style: { width: frameW, height: frameH },
      zIndex: -1,
    }

    const updatedNodes = childNodeIds && childNodeIds.length > 0
      ? [
          frameNode,
          ...currentNodes.map((n) =>
            childNodeIds.includes(n.id)
              ? { ...n, parentId: id, position: { x: n.position.x - frameX, y: n.position.y - frameY } }
              : n,
          ),
        ]
      : [...currentNodes, frameNode]

    set({ nodes: updatedNodes })
    return id
  },

  updateFrame: (id, data) => {
    set({
      nodes: get().nodes.map((n) => {
        if (n.id !== id) return n
        const updated = { ...n.data, ...data } as unknown as FrameData
        return { ...n, data: updated as unknown as Record<string, unknown>, style: { width: updated.width, height: updated.height } }
      }),
    })
  },

  deleteFrame: (id) => {
    get().pushHistory()
    const frame = get().nodes.find((n) => n.id === id)
    const framePos = frame?.position ?? { x: 0, y: 0 }
    set({
      nodes: get().nodes
        .filter((n) => n.id !== id)
        .map((n) =>
          n.parentId === id
            ? { ...n, parentId: undefined, position: { x: n.position.x + framePos.x, y: n.position.y + framePos.y } }
            : n,
        ),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
    })
  },

  updateConnection: (id, data) => {
    get().pushHistory()
    set({ edges: get().edges.map((e) => e.id === id ? { ...e, data: { ...e.data, ...data } } : e) })
  },

  deleteConnection: (id) => {
    get().pushHistory()
    set({ edges: get().edges.filter((e) => e.id !== id) })
  },

  getConnection: (id) => {
    const e = get().edges.find((e) => e.id === id)
    if (!e) return undefined
    return { ...(e.data as unknown as ConnectionData), id: e.id }
  },

  // --- Selection ---
  selectedCardId: null,
  selectCard: (id) => set({ selectedCardId: id }),

  // --- Filters ---
  activeFilters: EMPTY_FILTERS,
  toggleFilter: (key, value) => {
    const current = get().activeFilters[key] as string[]
    const exists = current.includes(value as string)
    set({ activeFilters: { ...get().activeFilters, [key]: exists ? current.filter((v) => v !== value) : [...current, value as string] } })
  },
  clearFilters: () => set({ activeFilters: EMPTY_FILTERS }),

  // --- Persistence ---
  lastSavedAt: null,
  saveNow: () => {
    const { activeBoardId, nodes, edges } = get()
    debouncedApiSave.flush()
    apiAutosave(activeBoardId, { nodes, edges })
      .then(() => set({ lastSavedAt: new Date() }))
      .catch(() => {/* ignore */})
  },

  // --- Search ---
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q, searchResultIndex: 0 }),
  searchResultIndex: 0,
  setSearchResultIndex: (i) => set({ searchResultIndex: i }),

  // --- Undo / Redo ---
  past: [],
  future: [],

  pushHistory: () => {
    const { nodes, edges, past } = get()
    const snapshot = { nodes: [...nodes], edges: [...edges] }
    const nextPast = [...past, snapshot].slice(-50)
    set({ past: nextPast, future: [] })
  },

  undo: () => {
    const { nodes, edges, past, future } = get()
    if (past.length === 0) return
    const prev = past[past.length - 1]
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      past: past.slice(0, -1),
      future: [{ nodes: [...nodes], edges: [...edges] }, ...future].slice(0, 50),
    })
  },

  redo: () => {
    const { nodes, edges, past, future } = get()
    if (future.length === 0) return
    const next = future[0]
    set({
      nodes: next.nodes,
      edges: next.edges,
      future: future.slice(1),
      past: [...past, { nodes: [...nodes], edges: [...edges] }].slice(-50),
    })
  },

  // --- Theme ---
  theme: initTheme,
  setTheme: (t) => {
    document.documentElement.setAttribute('data-theme', t)
    lsSet('fadenbrett-theme', t)
    set({ theme: t })
  },

  // --- Presentation ---
  presentationStops: initPresentationStops,
  presentationActive: false,
  presentationIndex: 0,

  addPresentationStop: (nodeId, label) => {
    const { presentationStops, nodes } = get()
    if (presentationStops.some((s) => s.nodeId === nodeId)) return
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return
    const stop: PresentationStop = { id: generateId(), nodeId, label }
    const next = [...presentationStops, stop]
    set({ presentationStops: next })
    lsSet('fadenbrett-presentation', next)
  },

  removePresentationStop: (stopId) => {
    const next = get().presentationStops.filter((s) => s.id !== stopId)
    set({ presentationStops: next })
    lsSet('fadenbrett-presentation', next)
  },

  movePresentationStop: (stopId, direction) => {
    const stops = [...get().presentationStops]
    const idx = stops.findIndex((s) => s.id === stopId)
    if (idx === -1) return
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= stops.length) return
    ;[stops[idx], stops[newIdx]] = [stops[newIdx], stops[idx]]
    set({ presentationStops: stops })
    lsSet('fadenbrett-presentation', stops)
  },

  updatePresentationStopLabel: (stopId, label) => {
    const next = get().presentationStops.map((s) =>
      s.id === stopId ? { ...s, label: label || undefined } : s,
    )
    set({ presentationStops: next })
    lsSet('fadenbrett-presentation', next)
  },

  startPresentation: () => {
    if (get().presentationStops.length === 0) return
    set({ presentationActive: true, presentationIndex: 0 })
  },

  exitPresentation: () => set({ presentationActive: false }),

  nextStop: () => {
    const { presentationIndex, presentationStops } = get()
    if (presentationIndex < presentationStops.length - 1)
      set({ presentationIndex: presentationIndex + 1 })
  },

  prevStop: () => {
    const { presentationIndex } = get()
    if (presentationIndex > 0) set({ presentationIndex: presentationIndex - 1 })
  },

  // --- Collaboration ---
  localUser: initUser,
  remoteUsers: {},
  collaborating: false,

  startCollab: () => {
    const state = get()
    if (state.collaborating) return
    collabChannel.open(state.activeBoardId)

    const unsub = collabChannel.subscribe((msg) => {
      const cur = get()
      if (msg.boardId !== cur.activeBoardId) return

      if (msg.type === 'presence') {
        if (msg.user.id === cur.localUser.id) return
        set({ remoteUsers: { ...cur.remoteUsers, [msg.user.id]: { ...msg.user, lastSeen: Date.now() } } })
      } else if (msg.type === 'state-sync') {
        if (msg.user.id === cur.localUser.id) return
        get().pushHistory()
        set({
          nodes: msg.nodes,
          edges: msg.edges,
          remoteUsers: { ...get().remoteUsers, [msg.user.id]: { ...msg.user, lastSeen: Date.now() } },
        })
      } else if (msg.type === 'cursor-move') {
        if (msg.userId === cur.localUser.id) return
        const remote = cur.remoteUsers[msg.userId]
        if (remote) {
          set({ remoteUsers: { ...cur.remoteUsers, [msg.userId]: { ...remote, cursor: msg.cursor, lastSeen: Date.now() } } })
        }
      } else if (msg.type === 'leave') {
        const next = { ...cur.remoteUsers }
        delete next[msg.userId]
        set({ remoteUsers: next })
      }
    })

    ;(collabChannel as { _unsub?: () => void })._unsub = unsub
    set({ collaborating: true })

    collabChannel.send({ type: 'presence', boardId: state.activeBoardId, user: state.localUser })
    const { nodes, edges, activeBoardId, localUser } = get()
    collabChannel.send({ type: 'state-sync', boardId: activeBoardId, nodes, edges, user: localUser })
  },

  stopCollab: () => {
    const { localUser, activeBoardId } = get()
    collabChannel.send({ type: 'leave', boardId: activeBoardId, userId: localUser.id })
    ;(collabChannel as { _unsub?: () => void })._unsub?.()
    set({ collaborating: false, remoteUsers: {} })
  },

  sendCursorMove: (cursor) => {
    const { collaborating, localUser, activeBoardId } = get()
    if (!collaborating) return
    collabChannel.send({ type: 'cursor-move', boardId: activeBoardId, userId: localUser.id, cursor })
  },

  setLocalUserName: (name) => {
    const user = { ...get().localUser, name }
    lsSet('fadenbrett-user', user)
    set({ localUser: user })
    const { collaborating, activeBoardId } = get()
    if (collaborating) collabChannel.send({ type: 'presence', boardId: activeBoardId, user })
  },

  // --- Clipboard (copy/paste) ---
  clipboard: null,

  copySelected: () => {
    const { nodes, edges } = get()
    const selected = nodes.filter((n) => n.selected)
    if (selected.length === 0) return
    const selectedIds = new Set(selected.map((n) => n.id))
    const internalEdges = edges.filter((e) => selectedIds.has(e.source) && selectedIds.has(e.target))
    set({ clipboard: { nodes: selected, edges: internalEdges } })
  },

  pasteClipboard: () => {
    const { clipboard } = get()
    if (!clipboard || clipboard.nodes.length === 0) return
    get().pushHistory()
    const idMap = new Map<string, string>()
    clipboard.nodes.forEach((n) => idMap.set(n.id, generateId()))
    const newNodes: Node[] = clipboard.nodes.map((n) => ({
      ...n,
      id: idMap.get(n.id)!,
      position: { x: n.position.x + 40, y: n.position.y + 40 },
      selected: true,
      data: { ...n.data, id: idMap.get(n.id)! },
      ...(n.parentId && idMap.has(n.parentId) ? { parentId: idMap.get(n.parentId)! } : {}),
    }))
    const newEdges: Edge[] = clipboard.edges.map((e) => ({
      ...e,
      id: `e-${generateId()}`,
      source: idMap.get(e.source) ?? e.source,
      target: idMap.get(e.target) ?? e.target,
    }))
    // Deselect current nodes
    const deselected = get().nodes.map((n) => (n.selected ? { ...n, selected: false } : n))
    const deselectedEdges = get().edges.map((e) => (e.selected ? { ...e, selected: false } : e))
    set({ nodes: [...deselected, ...newNodes], edges: [...deselectedEdges, ...newEdges] })
  },

  duplicateNodes: (nodeIds) => {
    const { nodes, edges } = get()
    const toDuplicate = nodes.filter((n) => nodeIds.includes(n.id))
    if (toDuplicate.length === 0) return
    const selectedIds = new Set(nodeIds)
    const internalEdges = edges.filter((e) => selectedIds.has(e.source) && selectedIds.has(e.target))
    get().pushHistory()
    const idMap = new Map<string, string>()
    toDuplicate.forEach((n) => idMap.set(n.id, generateId()))
    const newNodes: Node[] = toDuplicate.map((n) => ({
      ...n,
      id: idMap.get(n.id)!,
      position: { x: n.position.x + 40, y: n.position.y + 40 },
      selected: true,
      data: { ...n.data, id: idMap.get(n.id)! },
      ...(n.parentId && idMap.has(n.parentId) ? { parentId: idMap.get(n.parentId)! } : {}),
    }))
    const newEdges: Edge[] = internalEdges.map((e) => ({
      ...e,
      id: `e-${generateId()}`,
      source: idMap.get(e.source) ?? e.source,
      target: idMap.get(e.target) ?? e.target,
    }))
    const deselected = nodes.map((n) => (n.selected ? { ...n, selected: false } : n))
    const deselectedEdges = edges.map((e) => (e.selected ? { ...e, selected: false } : e))
    set({ nodes: [...deselected, ...newNodes], edges: [...deselectedEdges, ...newEdges] })
  },

  applyTemplate: (name, nodes, edges) => {
    const id = `board-${generateId()}`
    const state = get()
    const updatedBoards = {
      ...state.boards,
      [state.activeBoardId]: { ...state.boards[state.activeBoardId], nodes: state.nodes, edges: state.edges },
      [id]: { id, name, nodes, edges },
    }
    set({ boards: updatedBoards, activeBoardId: id, nodes, edges, selectedCardId: null, activeFilters: EMPTY_FILTERS, past: [], future: [] })
    lsSet('fadenbrett-active-board', id)
    apiCreateBoard(name, id).catch(() => {/* ignore */})
  },
}))

// ---------------------------------------------------------------------------
// Auto-broadcast collab changes
// ---------------------------------------------------------------------------

let _prevNodes: Node[] = []
let _prevEdges: Edge[] = []
useBoardStore.subscribe((state) => {
  if (!state.collaborating) return
  const nodesChanged = state.nodes !== _prevNodes
  const edgesChanged = state.edges !== _prevEdges
  if (nodesChanged || edgesChanged) {
    _prevNodes = state.nodes
    _prevEdges = state.edges
    collabChannel.send({
      type: 'state-sync',
      boardId: state.activeBoardId,
      nodes: state.nodes,
      edges: state.edges,
      user: state.localUser,
    })
  }
})

// ---------------------------------------------------------------------------
// Debounced autosave subscription — triggers on nodes/edges change
// ---------------------------------------------------------------------------

let _saveNodes: Node[] = []
let _saveEdges: Edge[] = []
useBoardStore.subscribe((state) => {
  if (state.apiStatus !== 'connected') return
  const nodesChanged = state.nodes !== _saveNodes
  const edgesChanged = state.edges !== _saveEdges
  if (nodesChanged || edgesChanged) {
    _saveNodes = state.nodes
    _saveEdges = state.edges
    debouncedApiSave(state.activeBoardId, state.nodes, state.edges)
  }
})
