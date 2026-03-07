import { Handle, Position, type NodeProps } from '@xyflow/react'
import { memo, useState, useCallback, useRef, useEffect } from 'react'
import type { NoteData } from './types'
import { NOTE_COLORS } from './types'
import { useBoardStore } from '../../store/board-store'

function NoteNodeComponent({ id, data, selected }: NodeProps) {
  const { content, color, rotation } = data as unknown as NoteData
  const handleClassName = '!h-2 !w-2 !bg-black/30 !opacity-25 group-hover:!opacity-60 !transition-opacity'
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const updateNote = useBoardStore((s) => s.updateNote)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.selectionStart = textareaRef.current.value.length
    }
  }, [isEditing])

  const commitEdit = useCallback(() => {
    setIsEditing(false)
    setShowColorPicker(false)
    updateNote(id, { content: editContent })
  }, [id, editContent, updateNote])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setEditContent((data as unknown as NoteData).content)
    setIsEditing(true)
  }, [data])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        commitEdit()
      }
      // Stop propagation so React Flow doesn't handle keys while editing
      e.stopPropagation()
    },
    [commitEdit],
  )

  const handleColorChange = useCallback(
    (newColor: string) => {
      updateNote(id, { color: newColor })
      setShowColorPicker(false)
    },
    [id, updateNote],
  )

  // Darken color for text contrast
  const textColor = '#1a1a1a'

  return (
    <div
      className={`group relative w-48 cursor-grab shadow-md transition-shadow ${
        selected ? 'shadow-lg shadow-black/40' : 'hover:shadow-lg'
      }`}
      style={{
        backgroundColor: color,
        transform: `rotate(${rotation}deg)`,
        borderRadius: '2px',
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle
        type="source"
        id="left"
        position={Position.Left}
        className={handleClassName}
      />
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        className={handleClassName}
      />
      <Handle
        type="source"
        id="top"
        position={Position.Top}
        className={handleClassName}
      />
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        className={handleClassName}
      />

      {/* Color picker toggle */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setShowColorPicker(!showColorPicker)
        }}
        className="absolute right-1 top-1 h-4 w-4 rounded-full opacity-0 transition-opacity group-hover:opacity-70 hover:!opacity-100"
        style={{ backgroundColor: textColor + '30' }}
      />

      {showColorPicker && (
        <div className="absolute right-0 top-6 z-10 flex gap-1 rounded bg-white/90 p-1.5 shadow-lg">
          {NOTE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleColorChange(c)
              }}
              className={`h-5 w-5 rounded-full border ${
                c === color ? 'border-black/60 scale-110' : 'border-black/20'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

      <div className="p-3" style={{ minHeight: '80px' }}>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="h-full w-full resize-none border-none bg-transparent text-sm outline-none"
            style={{ color: textColor, minHeight: '60px' }}
            placeholder="Write a note..."
          />
        ) : (
          <p
            className="whitespace-pre-wrap text-sm"
            style={{ color: textColor }}
          >
            {content || 'Double-click to edit...'}
          </p>
        )}
      </div>

      {/* Folded corner effect */}
      <div
        className="absolute bottom-0 right-0 h-4 w-4"
        style={{
          background: `linear-gradient(135deg, ${color} 50%, rgba(0,0,0,0.1) 50%)`,
        }}
      />
    </div>
  )
}

export default memo(NoteNodeComponent)
