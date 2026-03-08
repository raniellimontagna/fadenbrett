import { useCallback, useRef } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useBoardStore, type Ruler } from '../../store/board-store'

/** Snap threshold in flow units */
const SNAP_THRESHOLD = 12

export function useRulerSnap() {
  const rulers = useBoardStore((s) => s.rulers)
  const rulersVisible = useBoardStore((s) => s.rulersVisible)

  const snapPosition = useCallback(
    (pos: { x: number; y: number }): { x: number; y: number } => {
      if (!rulersVisible || rulers.length === 0) return pos
      let { x, y } = pos
      for (const r of rulers) {
        if (r.axis === 'v' && Math.abs(x - r.position) <= SNAP_THRESHOLD) x = r.position
        if (r.axis === 'h' && Math.abs(y - r.position) <= SNAP_THRESHOLD) y = r.position
      }
      return { x, y }
    },
    [rulers, rulersVisible],
  )

  return snapPosition
}

interface RulerLineProps {
  ruler: Ruler
  canvasRect: DOMRect | null
  viewport: { x: number; y: number; zoom: number }
}

function RulerLine({ ruler, canvasRect, viewport }: RulerLineProps) {
  const { updateRuler, removeRuler } = useBoardStore()
  const isDragging = useRef(false)

  const toScreen = (flowVal: number, axis: 'h' | 'v'): number => {
    if (!canvasRect) return 0
    if (axis === 'v') return flowVal * viewport.zoom + viewport.x
    return flowVal * viewport.zoom + viewport.y
  }

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      isDragging.current = true
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

      const onMove = (ev: PointerEvent) => {
        if (!isDragging.current || !canvasRect) return
        if (ruler.axis === 'v') {
          const flowX = (ev.clientX - canvasRect.left - viewport.x) / viewport.zoom
          updateRuler(ruler.id, flowX)
        } else {
          const flowY = (ev.clientY - canvasRect.top - viewport.y) / viewport.zoom
          updateRuler(ruler.id, flowY)
        }
      }

      const onUp = () => {
        isDragging.current = false
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [ruler, canvasRect, viewport, updateRuler],
  )

  const screenPos = toScreen(ruler.position, ruler.axis)

  const isVertical = ruler.axis === 'v'

  // Derived CSS. The hit area is wider/taller than the visual line for easier dragging.
  const lineStyle: React.CSSProperties = isVertical
    ? {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: screenPos,
        width: 1,
        transform: 'translateX(-0.5px)',
        cursor: 'ew-resize',
        zIndex: 9,
      }
    : {
        position: 'absolute',
        left: 0,
        right: 0,
        top: screenPos,
        height: 1,
        transform: 'translateY(-0.5px)',
        cursor: 'ns-resize',
        zIndex: 9,
      }

  const hitStyle: React.CSSProperties = isVertical
    ? { position: 'absolute', top: 0, bottom: 0, left: -6, right: -6 }
    : { position: 'absolute', top: -6, bottom: -6, left: 0, right: 0 }

  return (
    <div
      style={lineStyle}
      className="pointer-events-auto group"
      onPointerDown={handlePointerDown}
    >
      {/* Visual line */}
      <div
        className="absolute inset-0 bg-fadenbrett-accent/70 group-hover:bg-fadenbrett-accent transition-colors"
        style={isVertical ? { width: 1 } : { height: 1 }}
      />
      {/* Extended hit area */}
      <div style={hitStyle} />
      {/* Delete button */}
      <button
        className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-fadenbrett-surface border border-fadenbrett-muted/40 rounded text-[10px] px-1 text-fadenbrett-muted hover:text-red-400 hover:border-red-400/40"
        style={
          isVertical
            ? { top: 8, left: 4, transform: 'none' }
            : { left: 8, top: 4, transform: 'none' }
        }
        onClick={(e) => { e.stopPropagation(); removeRuler(ruler.id) }}
        title="Remover régua"
      >
        ✕
      </button>
    </div>
  )
}

export function RulerOverlay() {
  const rulers = useBoardStore((s) => s.rulers)
  const rulersVisible = useBoardStore((s) => s.rulersVisible)
  const { getViewport } = useReactFlow()

  const canvasRef = useRef<HTMLDivElement | null>(null)

  // Resolve the canvas DOM rect from the react-flow wrapper
  const getCanvasRect = (): DOMRect | null => {
    const el = document.querySelector('.react-flow__renderer') as HTMLElement | null
    return el?.getBoundingClientRect() ?? null
  }

  if (!rulersVisible || rulers.length === 0) return null

  const viewport = getViewport()
  const canvasRect = getCanvasRect()

  return (
    <div
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-8 overflow-hidden"
    >
      {rulers.map((ruler) => (
        <RulerLine key={ruler.id} ruler={ruler} canvasRect={canvasRect} viewport={viewport} />
      ))}
    </div>
  )
}
