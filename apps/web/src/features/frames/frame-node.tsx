import { memo, useState, useCallback, useRef } from 'react'
import { NodeResizer, type NodeProps } from '@xyflow/react'
import { useBoardStore } from '../../store/board-store'
import type { FrameData } from './types'
import { FRAME_COLORS } from './types'

function FrameNodeComponent({ data, selected, id }: NodeProps) {
  const { title, color, width, height } = data as unknown as FrameData
  const updateFrame = useBoardStore((s) => s.updateFrame)

  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(title)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const commitTitle = useCallback(() => {
    setEditing(false)
    if (editValue.trim() !== title) updateFrame(id, { title: editValue.trim() || title })
  }, [editValue, title, id, updateFrame])

  const onResizeEnd = useCallback(
    (_: unknown, params: { width: number; height: number }) => {
      updateFrame(id, { width: params.width, height: params.height })
    },
    [id, updateFrame],
  )

  return (
    <div
      className="relative rounded-lg"
      style={{
        width,
        height,
        border: `2px solid ${color}`,
        backgroundColor: color + '14',
        boxSizing: 'border-box',
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={150}
        onResizeEnd={onResizeEnd}
        lineStyle={{ borderColor: color }}
        handleStyle={{ borderColor: color, backgroundColor: color }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-1.5"
        style={{ backgroundColor: color + '30', borderRadius: '6px 6px 0 0' }}
      >
        {/* Color picker */}
        <div className="relative">
          <button
            className="h-4 w-4 shrink-0 rounded-full border border-white/30 transition-transform hover:scale-110"
            style={{ backgroundColor: color }}
            onClick={(e) => { e.stopPropagation(); setShowColorPicker((p) => !p) }}
            onDoubleClick={(e) => e.stopPropagation()}
            title="Cor do frame"
          />
          {showColorPicker && (
            <div
              className="absolute left-0 top-6 z-50 flex gap-1 rounded-md border border-fadenbrett-muted/30 bg-fadenbrett-surface p-1.5 shadow-lg"
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              {FRAME_COLORS.map((c) => (
                <button
                  key={c}
                  className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 ${c === color ? 'border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => { updateFrame(id, { color: c }); setShowColorPicker(false) }}
                />
              ))}
            </div>
          )}
        </div>

        {editing ? (
          <input
            ref={inputRef}
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle()
              if (e.key === 'Escape') { setEditing(false); setEditValue(title) }
              e.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            className="min-w-0 flex-1 rounded bg-transparent text-xs font-semibold text-fadenbrett-text outline-none"
            style={{ color }}
          />
        ) : (
          <span
            className="flex-1 truncate text-xs font-semibold select-none"
            style={{ color }}
            onDoubleClick={(e) => {
              e.stopPropagation()
              setEditing(true)
              setEditValue(title)
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
          >
            {title}
          </span>
        )}
      </div>
    </div>
  )
}

export default memo(FrameNodeComponent)
