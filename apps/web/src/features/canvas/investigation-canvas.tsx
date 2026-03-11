import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ConnectionMode,
  SelectionMode,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
  type NodeMouseHandler,
  type Edge,
  type Node,
  type Connection,
} from '@xyflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useBoardStore } from '../../store/board-store'
import CardNodeComponent from '../cards/card-node'
import { CardForm } from '../cards/card-form'
import { type CardData, type CustomFieldType, DEFAULT_CARD_DATA } from '../cards/types'
import { ConnectionForm } from '../connections/connection-form'
import { type ConnectionData } from '../connections/types'
import YarnEdgeComponent from '../connections/yarn-edge'
import NoteNodeComponent from '../notes/note-node'
import FrameNodeComponent from '../frames/frame-node'
import { ContextMenu, type ContextMenuState } from './context-menu'
import { ConfirmDialog } from './confirm-dialog'
import { FilterBar } from '../filters/filter-bar'
import { DetailPanel } from '../detail-panel/detail-panel'
import { ExportToolbar } from './export-toolbar'
import { AutoLayoutToolbar } from './auto-layout-toolbar'
import { PresentationOverlay } from '../presentation/presentation-overlay'
import { RemoteCursors } from '../collab/remote-cursors'
import { useLongPress } from '../../hooks/use-long-press'
import { RulerOverlay } from './ruler-overlay'
import { navigateRef } from '../../lib/navigate-ref'

const nodeTypes: NodeTypes = {
  card: CardNodeComponent,
  note: NoteNodeComponent,
  frame: FrameNodeComponent,
}

const edgeTypes: EdgeTypes = {
  yarn: YarnEdgeComponent,
}

export function InvestigationCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addCard,
    updateCard,
    deleteCard,
    getCard,
    addNote,
    deleteNote,
    addFrame,
    deleteFrame,
    updateConnection,
    deleteConnection,
    getConnection,
    activeFilters,
    selectedCardId,
    selectCard,
    saveNow,
    lastSavedAt,
    searchQuery,
    searchResultIndex,
    setSearchResultIndex,
    undo,
    redo,
    addPresentationStop,
    presentationActive,
    copySelected,
    pasteClipboard,
    duplicateNodes,
    bringToFront,
    sendToBack,
    rulersVisible,
    toggleRulers,
    addRuler,
    reconnectEdge,
  } = useBoardStore()
  const { zoomIn, zoomOut, fitView, screenToFlowPosition } = useReactFlow()
  const containerRef = useRef<HTMLDivElement>(null)

  const [editingCard, setEditingCard] = useState<CardData | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createPosition, setCreatePosition] = useState({ x: 0, y: 0 })
  const [editingEdge, setEditingEdge] = useState<(ConnectionData & { id: string }) | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ nodeIds: string[]; edgeIds: string[] } | null>(null)

  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes])
  const selectedEdges = useMemo(() => edges.filter((e) => e.selected), [edges])

  // --- Filter dimming ---

  const filtersActive = useMemo(
    () =>
      activeFilters.groups.length > 0 ||
      activeFilters.tags.length > 0 ||
      activeFilters.eras.length > 0 ||
      activeFilters.connectionStyles.length > 0,
    [activeFilters],
  )

  const matchedNodeIds = useMemo(() => {
    if (!filtersActive) return null
    const ids = new Set<string>()
    for (const node of nodes) {
      if (node.type === 'note') {
        // Notes are not subject to card-based filters; dim only if connection filter is the only active one
        if (activeFilters.groups.length === 0 && activeFilters.tags.length === 0 && activeFilters.eras.length === 0) {
          ids.add(node.id)
        }
        continue
      }
      if (node.type === 'card') {
        const card = node.data as unknown as CardData
        const groupMatch = activeFilters.groups.length === 0 || activeFilters.groups.includes(card.groupColor)
        const tagMatch =
          activeFilters.tags.length === 0 || card.tags.some((t) => activeFilters.tags.includes(t))
        const eraMatch = activeFilters.eras.length === 0 || activeFilters.eras.includes(card.eraLabel)
        if (groupMatch && tagMatch && eraMatch) ids.add(node.id)
      }
    }
    return ids
  }, [nodes, activeFilters, filtersActive])

  // --- Search highlighting ---

  const searchActive = searchQuery.trim().length > 0

  const searchMatchIds = useMemo(() => {
    if (!searchActive) return null
    const q = searchQuery.toLowerCase()
    const ids = new Set<string>()
    for (const node of nodes) {
      if (node.type === 'card') {
        const card = node.data as unknown as CardData
        const matches =
          card.title.toLowerCase().includes(q) ||
          card.description.toLowerCase().includes(q) ||
          (card.eraLabel ?? '').toLowerCase().includes(q) ||
          card.tags.some((t) => t.toLowerCase().includes(q)) ||
          (card.customFields ?? []).some((f) => f.value.toString().toLowerCase().includes(q))
        if (matches) ids.add(node.id)
      } else if (node.type === 'note') {
        const note = node.data as unknown as { content: string }
        if ((note.content ?? '').toLowerCase().includes(q)) ids.add(node.id)
      }
    }
    for (const edge of edges) {
      const conn = edge.data as unknown as { label?: string }
      if (conn?.label?.toLowerCase().includes(q)) {
        ids.add(edge.source)
        ids.add(edge.target)
      }
    }
    return ids
  }, [nodes, edges, searchQuery, searchActive])

  const searchResultIds = useMemo(() => {
    if (!searchMatchIds) return []
    return [...searchMatchIds]
  }, [searchMatchIds])

  // Navigate to current search result
  useEffect(() => {
    if (!searchActive || searchResultIds.length === 0) return
    const idx = Math.min(searchResultIndex, searchResultIds.length - 1)
    const id = searchResultIds[idx]
    if (id) fitView({ nodes: [{ id }], duration: 400, padding: 0.4 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchActive, searchResultIndex, searchResultIds.join(',')])

  const displayNodes = useMemo<Node[]>(() => {
    const filterDim = filtersActive && matchedNodeIds
    const searchDim = searchActive && searchMatchIds
    if (!filterDim && !searchDim) return nodes
    return nodes.map((node) => {
      const filterOk = !filterDim || matchedNodeIds!.has(node.id)
      const searchOk = !searchDim || searchMatchIds!.has(node.id)
      const opacity = filterOk && searchOk ? 1 : 0.12
      return { ...node, style: { ...node.style, opacity, transition: 'opacity 0.2s' } }
    })
  }, [nodes, filtersActive, matchedNodeIds, searchActive, searchMatchIds])

  const displayEdges = useMemo<Edge[]>(() => {
    const filterDim = filtersActive && matchedNodeIds
    const searchDim = searchActive && searchMatchIds
    if (!filterDim && !searchDim) return edges
    return edges.map((edge) => {
      const connData = edge.data as unknown as { style?: string; label?: string }
      const styleMatch =
        activeFilters.connectionStyles.length === 0 ||
        activeFilters.connectionStyles.includes(connData?.style as never)
      const filterNodeMatch = !filterDim ||
        (matchedNodeIds!.has(edge.source) && matchedNodeIds!.has(edge.target))
      const searchNodeMatch = !searchDim ||
        (searchMatchIds!.has(edge.source) && searchMatchIds!.has(edge.target))
      const visible = styleMatch && filterNodeMatch && searchNodeMatch
      return {
        ...edge,
        style: { ...edge.style, opacity: visible ? 1 : 0.08, transition: 'opacity 0.2s' },
      }
    })
  }, [edges, filtersActive, matchedNodeIds, searchActive, searchMatchIds, activeFilters.connectionStyles])

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  // --- 30-second periodic auto-save ---

  useEffect(() => {
    const id = setInterval(() => saveNow(), 30_000)
    return () => clearInterval(id)
  }, [saveNow])

  // --- Detail panel navigation ---

  const navigateToNode = useCallback(
    (nodeId: string) => {
      fitView({ nodes: [{ id: nodeId }], duration: 600, padding: 0.5 })
      // If the connected node is a card, open its detail panel
      const node = nodes.find((n) => n.id === nodeId)
      if (node?.type === 'card') {
        selectCard(nodeId)
      }
    },
    [fitView, nodes, selectCard],
  )

  // Expose navigateToNode for command palette
  useEffect(() => {
    navigateRef.current = navigateToNode
    return () => { navigateRef.current = null }
  }, [navigateToNode])

  const handleOpenEditFromPanel = useCallback(() => {
    if (!selectedCardId) return
    const card = getCard(selectedCardId)
    if (card) {
      setEditingCard(card)
      setIsCreating(false)
    }
  }, [selectedCardId, getCard])

  // --- Double-click handlers ---

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (node.type === 'card') {
        selectCard(node.id)
      } else {
        selectCard(null)
      }
    },
    [selectCard],
  )

  const onPaneClick = useCallback(() => {
    closeContextMenu()
    selectCard(null)
  }, [closeContextMenu, selectCard])

  const onPaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      // Ignore double-clicks on nodes/edges — those are handled by onNodeDoubleClick/onEdgeDoubleClick
      const target = event.target as HTMLElement
      if (target.closest('.react-flow__node') || target.closest('.react-flow__edge')) return

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      if (event.shiftKey) {
        addNote(position)
        return
      }
      setCreatePosition(position)
      setEditingCard({ ...DEFAULT_CARD_DATA, id: '' })
      setIsCreating(true)
    },
    [screenToFlowPosition, addNote],
  )

  const onNodeDoubleClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (node.type !== 'card') return
      const card = getCard(node.id)
      if (card) {
        setEditingCard(card)
        setIsCreating(false)
      }
    },
    [getCard],
  )

  const onEdgeDoubleClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      const conn = getConnection(edge.id)
      if (conn) setEditingEdge(conn)
    },
    [getConnection],
  )

  // --- Card form handlers ---

  const handleSave = useCallback(
    (data: Omit<CardData, 'id'>) => {
      if (isCreating) {
        addCard(createPosition, data)
      } else if (editingCard) {
        updateCard(editingCard.id, data)
      }
      setEditingCard(null)
    },
    [isCreating, editingCard, addCard, updateCard, createPosition],
  )

  const handleDelete = useCallback(() => {
    if (editingCard && !isCreating) {
      deleteCard(editingCard.id)
    }
    setEditingCard(null)
  }, [editingCard, isCreating, deleteCard])

  // --- Connection form handlers ---

  const handleConnectionSave = useCallback(
    (data: ConnectionData) => {
      if (editingEdge) {
        updateConnection(editingEdge.id, data)
      }
      setEditingEdge(null)
    },
    [editingEdge, updateConnection],
  )

  const handleConnectionDelete = useCallback(() => {
    if (editingEdge) {
      deleteConnection(editingEdge.id)
    }
    setEditingEdge(null)
  }, [editingEdge, deleteConnection])

  // --- Deletion with confirmation ---

  const performDelete = useCallback(
    (nodeIds: string[], edgeIds: string[]) => {
      const total = nodeIds.length + edgeIds.length
      if (total > 1) {
        setConfirmDelete({ nodeIds, edgeIds })
      } else {
        nodeIds.forEach((id) => {
          const node = nodes.find((n) => n.id === id)
          if (node?.type === 'card') deleteCard(id)
          else if (node?.type === 'note') deleteNote(id)
          else if (node?.type === 'frame') deleteFrame(id)
        })
        edgeIds.forEach((id) => deleteConnection(id))
      }
    },
    [nodes, deleteCard, deleteNote, deleteFrame, deleteConnection],
  )

  const confirmDeleteAction = useCallback(() => {
    if (!confirmDelete) return
    confirmDelete.nodeIds.forEach((id) => {
      const node = nodes.find((n) => n.id === id)
      if (node?.type === 'card') deleteCard(id)
      else if (node?.type === 'note') deleteNote(id)
      else if (node?.type === 'frame') deleteFrame(id)
    })
    confirmDelete.edgeIds.forEach((id) => deleteConnection(id))
    setConfirmDelete(null)
  }, [confirmDelete, nodes, deleteCard, deleteNote, deleteFrame, deleteConnection])

  // --- Context menu handlers ---

  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault()
      const flowPosition = screenToFlowPosition({ x: event.clientX, y: event.clientY })

      // If there's a multi-selection, show selection context menu
      const totalSelected = selectedNodes.length + selectedEdges.length
      if (totalSelected > 1) {
        setContextMenu({
          x: event.clientX,
          y: event.clientY,
          target: {
            type: 'selection',
            nodeIds: selectedNodes.map((n) => n.id),
            edgeIds: selectedEdges.map((e) => e.id),
          },
        })
        return
      }

      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        target: { type: 'pane', flowPosition },
      })
    },
    [screenToFlowPosition, selectedNodes, selectedEdges],
  )

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault()

      // If multiple items selected, show selection menu
      const totalSelected = selectedNodes.length + selectedEdges.length
      if (totalSelected > 1 && node.selected) {
        setContextMenu({
          x: event.clientX,
          y: event.clientY,
          target: {
            type: 'selection',
            nodeIds: selectedNodes.map((n) => n.id),
            edgeIds: selectedEdges.map((e) => e.id),
          },
        })
        return
      }

      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        target: {
          type: node.type === 'card' ? 'card' : node.type === 'frame' ? 'frame' : 'note',
          nodeId: node.id,
        },
      })
    },
    [selectedNodes, selectedEdges],
  )

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault()
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        target: { type: 'edge', edgeId: edge.id },
      })
    },
    [],
  )

  const handleContextAddCard = useCallback(
    (position: { x: number; y: number }) => {
      setCreatePosition(position)
      setEditingCard({ ...DEFAULT_CARD_DATA, id: '' })
      setIsCreating(true)
    },
    [],
  )

  const handleContextAddFrame = useCallback(
    (position: { x: number; y: number }) => addFrame(position),
    [addFrame],
  )

  const handleContextWrapInFrame = useCallback(
    (nodeIds: string[]) => addFrame({ x: 0, y: 0 }, nodeIds),
    [addFrame],
  )

  const handleContextAddToPresentation = useCallback(
    (nodeId: string) => addPresentationStop(nodeId),
    [addPresentationStop],
  )

  const handlePresentationStopChange = useCallback(
    (stopIndex: number) => {
      const stops = useBoardStore.getState().presentationStops
      const stop = stops[stopIndex]
      if (stop) {
        fitView({ nodes: [{ id: stop.nodeId }], duration: 700, padding: 0.35 })
      }
    },
    [fitView],
  )

  // Long-press on touch devices shows pane context menu
  const handleLongPress = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0] ?? e.changedTouches[0]
      if (!touch) return
      const flowPosition = screenToFlowPosition({ x: touch.clientX, y: touch.clientY })
      setContextMenu({
        x: touch.clientX,
        y: touch.clientY,
        target: { type: 'pane', flowPosition },
      })
    },
    [screenToFlowPosition],
  )

  const longPressHandlers = useLongPress({ onLongPress: handleLongPress })

  const handleContextEditCard = useCallback(
    (nodeId: string) => {
      const card = getCard(nodeId)
      if (card) {
        setEditingCard(card)
        setIsCreating(false)
      }
    },
    [getCard],
  )

  const handleContextEditConnection = useCallback(
    (edgeId: string) => {
      const conn = getConnection(edgeId)
      if (conn) setEditingEdge(conn)
    },
    [getConnection],
  )

  // --- Keyboard shortcuts ---

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Ignore when editing text
      const tag = (event.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        zoomIn()
      } else if (event.key === '-') {
        event.preventDefault()
        zoomOut()
      } else if (event.key === '0') {
        event.preventDefault()
        fitView()
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        const nodeIds = selectedNodes.map((n) => n.id)
        const edgeIds = selectedEdges.map((e) => e.id)
        if (nodeIds.length + edgeIds.length > 0) {
          performDelete(nodeIds, edgeIds)
        }
      } else if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        saveNow()
      } else if (event.key === 'z' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
        event.preventDefault()
        undo()
      } else if (
        (event.key === 'y' && (event.ctrlKey || event.metaKey)) ||
        (event.key === 'z' && (event.ctrlKey || event.metaKey) && event.shiftKey)
      ) {
        event.preventDefault()
        redo()
      } else if (event.key === 'c' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        copySelected()
      } else if (event.key === 'v' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        pasteClipboard()
      } else if (event.key === 'Escape') {
        closeContextMenu()
      }
    },
    [zoomIn, zoomOut, fitView, selectedNodes, selectedEdges, performDelete, closeContextMenu, saveNow, undo, redo, copySelected, pasteClipboard],
  )

  const confirmMessage = confirmDelete
    ? `Delete ${confirmDelete.nodeIds.length + confirmDelete.edgeIds.length} selected items? This cannot be undone.`
    : ''

  // Board-level field suggestions for custom fields autocomplete
  const fieldSuggestions = useMemo(() => {
    const seen = new Map<string, CustomFieldType>()
    for (const node of nodes) {
      if (node.type !== 'card') continue
      const card = node.data as unknown as CardData
      for (const f of card.customFields ?? []) {
        if (f.key && !seen.has(f.key)) seen.set(f.key, f.type)
      }
    }
    return Array.from(seen, ([key, type]) => ({ key, type }))
  }, [nodes])

  const savedLabel = lastSavedAt
    ? `Salvo ${lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : 'Não salvo'

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      onKeyDown={onKeyDown}
      tabIndex={0}
      style={{ touchAction: 'none' }}
      {...longPressHandlers}
    >
      <FilterBar />

      {/* Top-right toolbar */}
      <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-2" data-export-exclude="true">
        {/* Rulers toggle button */}
        <button
          onClick={toggleRulers}
          title={rulersVisible ? 'Ocultar réguas' : 'Mostrar réguas'}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border shadow-lg backdrop-blur-sm transition-colors ${
            rulersVisible
              ? 'border-fadenbrett-accent/60 bg-fadenbrett-accent/20 text-fadenbrett-accent'
              : 'border-fadenbrett-muted/30 bg-fadenbrett-surface/90 text-fadenbrett-muted hover:text-fadenbrett-text'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M3 6h18M3 12h18M3 18h18" />
            <path d="M6 3v18M12 3v18M18 3v18" opacity={0.5} />
          </svg>
        </button>
        {/* Add horizontal ruler */}
        {rulersVisible && (
          <>
            <button
              onClick={() => addRuler('h', 0)}
              title="Adicionar régua horizontal"
              className="flex h-8 items-center gap-1 rounded-lg border border-fadenbrett-muted/30 bg-fadenbrett-surface/90 px-2 text-xs text-fadenbrett-muted shadow-lg backdrop-blur-sm hover:text-fadenbrett-text"
            >
              ― H
            </button>
            <button
              onClick={() => addRuler('v', 0)}
              title="Adicionar régua vertical"
              className="flex h-8 items-center gap-1 rounded-lg border border-fadenbrett-muted/30 bg-fadenbrett-surface/90 px-2 text-xs text-fadenbrett-muted shadow-lg backdrop-blur-sm hover:text-fadenbrett-text"
            >
              | V
            </button>
          </>
        )}
        <AutoLayoutToolbar />
        <ExportToolbar containerRef={containerRef} />
      </div>

      {/* Search result navigator */}
      {searchActive && (
        <div className="pointer-events-auto absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1 rounded-md bg-fadenbrett-surface/90 px-2 py-1 text-[10px] text-fadenbrett-text shadow-md backdrop-blur-sm" data-export-exclude="true">
          {searchResultIds.length === 0 ? (
            <span className="text-fadenbrett-muted">Nenhum resultado</span>
          ) : (
            <>
              <button
                onClick={() => setSearchResultIndex(Math.max(0, searchResultIndex - 1))}
                disabled={searchResultIndex === 0}
                className="rounded p-0.5 text-fadenbrett-muted hover:text-fadenbrett-text disabled:opacity-30"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span>{Math.min(searchResultIndex + 1, searchResultIds.length)} / {searchResultIds.length}</span>
              <button
                onClick={() => setSearchResultIndex(Math.min(searchResultIds.length - 1, searchResultIndex + 1))}
                disabled={searchResultIndex >= searchResultIds.length - 1}
                className="rounded p-0.5 text-fadenbrett-muted hover:text-fadenbrett-text disabled:opacity-30"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </>
          )}
        </div>
      )}

      {/* Save status */}
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-md bg-fadenbrett-surface/70 px-2 py-1 text-[10px] text-fadenbrett-muted backdrop-blur-sm sm:bottom-40">
        <span className={`h-1.5 w-1.5 rounded-full ${lastSavedAt ? 'bg-green-500' : 'bg-fadenbrett-muted/40'}`} />
        {savedLabel}
      </div>
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={(oldEdge: Edge, newConnection: Connection) => reconnectEdge(oldEdge.id, newConnection)}
        reconnectRadius={20}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        onDoubleClick={onPaneDoubleClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'yarn' }}
        connectionMode={ConnectionMode.Loose}
        nodesDraggable={!presentationActive}
        nodesConnectable={!presentationActive}
        elementsSelectable={!presentationActive}
        edgesFocusable={!presentationActive}
        fitView
        panOnDrag={[0, 1]}
        panOnScroll={false}
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode="Shift"
        zoomOnScroll
        zoomOnPinch
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={null}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#404040"
        />
        <Controls
          showInteractive={false}
          className="bg-fadenbrett-surface! border-fadenbrett-muted/30! shadow-lg! [&>button]:bg-fadenbrett-surface! [&>button]:border-fadenbrett-muted/20! [&>button]:fill-fadenbrett-text! hover:[&>button]:bg-fadenbrett-muted/20!"
        />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'frame') return 'transparent'
            const d = n.data as Record<string, string>
            return d?.groupColor ?? '#737373'
          }}
          className="hidden! sm:block! bg-fadenbrett-surface! border-fadenbrett-muted/30!"
          maskColor="rgba(0,0,0,0.4)"
          pannable
          zoomable
        />
      </ReactFlow>

      {contextMenu && (
        <ContextMenu
          state={contextMenu}
          onClose={closeContextMenu}
          onAddCard={handleContextAddCard}
          onAddNote={(pos) => { addNote(pos); closeContextMenu() }}
          onAddFrame={handleContextAddFrame}
          onWrapInFrame={handleContextWrapInFrame}
          onEditCard={handleContextEditCard}
          onDeleteItems={performDelete}
          onEditConnection={handleContextEditConnection}
          onAddToPresentation={handleContextAddToPresentation}
          onDuplicate={(nodeIds) => { duplicateNodes(nodeIds); closeContextMenu() }}
          onBringToFront={(nodeIds) => { bringToFront(nodeIds); closeContextMenu() }}
          onSendToBack={(nodeIds) => { sendToBack(nodeIds); closeContextMenu() }}
        />
      )}

      {editingCard && (
        <CardForm
          initial={editingCard}
          onSave={handleSave}
          onCancel={() => setEditingCard(null)}
          onDelete={!isCreating ? handleDelete : undefined}
          fieldSuggestions={fieldSuggestions}
        />
      )}

      {editingEdge && (
        <ConnectionForm
          initial={editingEdge}
          onSave={handleConnectionSave}
          onCancel={() => setEditingEdge(null)}
          onDelete={handleConnectionDelete}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={confirmMessage}
          onConfirm={confirmDeleteAction}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {selectedCardId && (
        <DetailPanel
          onNavigateTo={navigateToNode}
          onEdit={handleOpenEditFromPanel}
        />
      )}

      <PresentationOverlay onStopChange={handlePresentationStopChange} />
      <RemoteCursors />
      <RulerOverlay />
    </div>
  )
}
