import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import { memo } from 'react'
import type { ConnectionData } from './types'

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
  const { label, style: lineStyle, color } =
    (data as unknown as ConnectionData) ?? { label: '', style: 'solid', color: '#b91c1c' }

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.3,
  })

  const strokeDasharray =
    lineStyle === 'dashed' ? '8 4' : lineStyle === 'dotted' ? '2 4' : undefined

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
      {label && (
        <EdgeLabelRenderer>
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
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(YarnEdgeComponent)
