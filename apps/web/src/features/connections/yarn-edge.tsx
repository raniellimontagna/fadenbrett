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
  const { label, style: lineStyle, color, routeType, curvature, direction } = connectionData

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

  // Build marker flags based on direction
  const markerEnd = direction === 'forward' || direction === 'both'
  const markerStart = direction === 'backward' || direction === 'both'

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

  const colorId = color.replace(/[^a-zA-Z0-9]/g, '')
  const markerEndId = `yarn-arrow-end-${colorId}`
  const markerStartId = `yarn-arrow-start-${colorId}`

  return (
    <>
      {/* Inline SVG marker definitions (rendered inside the RF SVG via g element) */}
      <defs>
        {markerEnd && (
          <marker
            id={markerEndId}
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L6,3 z" fill={color} />
          </marker>
        )}
        {markerStart && (
          <marker
            id={markerStartId}
            markerWidth="6"
            markerHeight="6"
            refX="1"
            refY="3"
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L6,3 z" fill={color} />
          </marker>
        )}
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd ? `url(#${markerEndId})` : undefined}
        markerStart={markerStart ? `url(#${markerStartId})` : undefined}
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
