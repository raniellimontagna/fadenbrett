import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react'
import { memo, useCallback, useRef } from 'react'
import { useBoardStore } from '../../store/board-store'
import type { ConnectionData } from './types'
import { DEFAULT_CONNECTION_DATA } from './types'

function YarnEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const connectionData = {
    ...DEFAULT_CONNECTION_DATA,
    ...(data as unknown as Partial<ConnectionData>),
  }
  const { label, style: lineStyle, color, routeType, curvature } = connectionData

  const pathParams = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }

  let edgePath: string
  let labelX: number
  let labelY: number

  if (routeType === 'straight') {
    ;[edgePath, labelX, labelY] = getStraightPath(pathParams)
  } else if (routeType === 'step') {
    ;[edgePath, labelX, labelY] = getSmoothStepPath({ ...pathParams, borderRadius: 8 })
  } else {
    ;[edgePath, labelX, labelY] = getBezierPath({ ...pathParams, curvature })
  }

  const strokeDasharray =
    lineStyle === 'dashed' ? '8 4' : lineStyle === 'dotted' ? '2 4' : undefined

  // Draggable curvature handle (only for bezier when selected)
  const updateConnection = useBoardStore((s) => s.updateConnection)
  const dragging = useRef(false)
  const startY = useRef(0)
  const startCurvature = useRef(curvature)

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation()
      e.preventDefault()
      dragging.current = true
      startY.current = e.clientY
      startCurvature.current = curvature

      const onPointerMove = (ev: PointerEvent) => {
        if (!dragging.current) return
        const dy = startY.current - ev.clientY
        const newCurvature = Math.min(1, Math.max(0, startCurvature.current + dy * 0.003))
        updateConnection(id, { curvature: Math.round(newCurvature * 100) / 100 })
      }

      const onPointerUp = () => {
        dragging.current = false
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)
      }

      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onPointerUp)
    },
    [curvature, id, updateConnection],
  )

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray,
          filter: selected ? `drop-shadow(0 0 4px ${color}80)` : undefined,
        }}
      />
      <EdgeLabelRenderer>
        {label && (
          <div
            className="nodrag nopan pointer-events-auto absolute rounded bg-fadenbrett-surface/90 px-2 py-0.5 text-xs"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              color,
              borderColor: color + '40',
              borderWidth: 1,
            }}
          >
            {label}
          </div>
        )}
        {selected && routeType === 'bezier' && (
          <div
            className="nodrag nopan pointer-events-auto absolute cursor-ns-resize"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            onPointerDown={onPointerDown}
          >
            <div
              className="h-3 w-3 rounded-full border-2 border-white"
              style={{ backgroundColor: color }}
            />
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}

export default memo(YarnEdgeComponent)
