import { useCallback, useEffect, useRef } from 'react'

export interface ContextMenuState {
  x: number
  y: number
  target:
    | { type: 'pane'; flowPosition: { x: number; y: number } }
    | { type: 'card'; nodeId: string }
    | { type: 'note'; nodeId: string }
    | { type: 'frame'; nodeId: string }
    | { type: 'edge'; edgeId: string }
    | { type: 'selection'; nodeIds: string[]; edgeIds: string[] }
}

interface ContextMenuProps {
  state: ContextMenuState
  onClose: () => void
  onAddCard: (position: { x: number; y: number }) => void
  onAddNote: (position: { x: number; y: number }) => void
  onAddFrame: (position: { x: number; y: number }) => void
  onWrapInFrame: (nodeIds: string[]) => void
  onEditCard: (nodeId: string) => void
  onDeleteItems: (nodeIds: string[], edgeIds: string[]) => void
  onEditConnection: (edgeId: string) => void
  onAddToPresentation: (nodeId: string) => void
}

export function ContextMenu({
  state,
  onClose,
  onAddCard,
  onAddNote,
  onAddFrame,
  onWrapInFrame,
  onEditCard,
  onDeleteItems,
  onEditConnection,
  onAddToPresentation,
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleAction = useCallback(
    (action: () => void) => {
      action()
      onClose()
    },
    [onClose],
  )

  const { target } = state

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-44 rounded-lg border border-fadenbrett-muted/30 bg-fadenbrett-surface py-1 shadow-2xl"
      style={{ left: state.x, top: state.y }}
    >
      {target.type === 'pane' && (
        <>
          <MenuItem label="Adicionar Card" shortcut="Dbl-click" onClick={() => handleAction(() => onAddCard(target.flowPosition))} />
          <MenuItem label="Adicionar Nota" shortcut="Shift+Dbl" onClick={() => handleAction(() => onAddNote(target.flowPosition))} />
          <Separator />
          <MenuItem label="Criar Frame" onClick={() => handleAction(() => onAddFrame(target.flowPosition))} />
        </>
      )}

      {target.type === 'card' && (
        <>
          <MenuItem label="Editar Card" shortcut="Dbl-click" onClick={() => handleAction(() => onEditCard(target.nodeId))} />
          <MenuItem label="Adicionar à Apresentação" onClick={() => handleAction(() => onAddToPresentation(target.nodeId))} />
          <Separator />
          <MenuItem label="Excluir Card" shortcut="Del" danger onClick={() => handleAction(() => onDeleteItems([target.nodeId], []))} />
        </>
      )}

      {target.type === 'note' && (
        <>
          <MenuItem label="Adicionar à Apresentação" onClick={() => handleAction(() => onAddToPresentation(target.nodeId))} />
          <Separator />
          <MenuItem label="Excluir Nota" shortcut="Del" danger onClick={() => handleAction(() => onDeleteItems([target.nodeId], []))} />
        </>
      )}

      {target.type === 'frame' && (
        <>
          <MenuItem label="Adicionar à Apresentação" onClick={() => handleAction(() => onAddToPresentation(target.nodeId))} />
          <Separator />
          <MenuItem label="Excluir Frame" shortcut="Del" danger onClick={() => handleAction(() => onDeleteItems([target.nodeId], []))} />
        </>
      )}

      {target.type === 'edge' && (
        <>
          <MenuItem label="Editar Conexão" shortcut="Dbl-click" onClick={() => handleAction(() => onEditConnection(target.edgeId))} />
          <Separator />
          <MenuItem label="Excluir Conexão" shortcut="Del" danger onClick={() => handleAction(() => onDeleteItems([], [target.edgeId]))} />
        </>
      )}

      {target.type === 'selection' && (
        <>
          <MenuItem
            label="Agrupar em Frame"
            onClick={() => handleAction(() => onWrapInFrame(target.nodeIds))}
          />
          <Separator />
          <MenuItem
            label={`Excluir ${target.nodeIds.length + target.edgeIds.length} itens`}
            shortcut="Del"
            danger
            onClick={() => handleAction(() => onDeleteItems(target.nodeIds, target.edgeIds))}
          />
        </>
      )}
    </div>
  )
}

function MenuItem({ label, shortcut, danger, onClick }: { label: string; shortcut?: string; danger?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full min-h-[44px] items-center justify-between px-3 py-2 text-left text-sm md:min-h-0 md:py-1.5 ${
        danger ? 'text-red-400 hover:bg-red-400/10' : 'text-fadenbrett-text hover:bg-fadenbrett-muted/20'
      }`}
    >
      <span>{label}</span>
      {shortcut && <span className="ml-4 text-xs text-fadenbrett-muted">{shortcut}</span>}
    </button>
  )
}

function Separator() {
  return <div className="my-1 border-t border-fadenbrett-muted/20" />
}
