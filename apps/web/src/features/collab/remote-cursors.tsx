import { useEffect, useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useBoardStore } from '../../store/board-store'

/**
 * Renders remote collaborator cursors as floating labels on the canvas.
 * Must be placed inside a ReactFlowProvider.
 */
export function RemoteCursors() {
  const remoteUsers = useBoardStore((s) => s.remoteUsers)
  const collaborating = useBoardStore((s) => s.collaborating)
  const sendCursorMove = useBoardStore((s) => s.sendCursorMove)
  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow()

  // Broadcast our cursor position to other tabs
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!collaborating) return
      const fp = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      sendCursorMove(fp)
    },
    [collaborating, screenToFlowPosition, sendCursorMove],
  )

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  if (!collaborating) return null

  const users = Object.values(remoteUsers).filter((u) => u.cursor !== null)

  return (
    <>
      {users.map((user) => {
        if (!user.cursor) return null
        const screen = flowToScreenPosition(user.cursor)
        return (
          <div
            key={user.id}
            className="pointer-events-none absolute z-50"
            style={{ left: screen.x, top: screen.y, transform: 'translate(4px, 4px)' }}
          >
            {/* Cursor arrow */}
            <svg width="16" height="20" viewBox="0 0 16 20" fill={user.color} className="drop-shadow-md">
              <path d="M0 0L16 9.5L9 11L5 20L0 0Z" />
            </svg>
            {/* Label */}
            <span
              className="block rounded px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-lg"
              style={{ backgroundColor: user.color, marginTop: 2 }}
            >
              {user.name}
            </span>
          </div>
        )
      })}
    </>
  )
}
