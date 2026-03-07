import { Handle, Position, type NodeProps } from '@xyflow/react'
import { memo } from 'react'
import type { CardData } from './types'

function CardNodeComponent({ data, selected }: NodeProps) {
  const { title, description, avatarType, avatarValue, tags, eraLabel, groupColor, imageUrl } =
    data as unknown as CardData
  const handleClassName =
    '!h-2 !w-2 !bg-fadenbrett-accent !opacity-30 group-hover:!opacity-70 !transition-opacity'

  const displayAvatar =
    avatarType === 'emoji' && avatarValue
      ? avatarValue
      : title
        ? title.slice(0, 2).toUpperCase()
        : '?'

  return (
    <div
      className={`group relative w-56 rounded-lg border-2 bg-fadenbrett-surface shadow-lg transition-shadow ${
        selected
          ? 'border-fadenbrett-accent shadow-fadenbrett-accent/30'
          : 'border-fadenbrett-muted/30 hover:border-fadenbrett-muted/60'
      }`}
      style={{ borderLeftColor: groupColor, borderLeftWidth: 4 }}
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

      <div className="p-3">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={title}
            className="mb-2 h-24 w-full rounded object-cover"
            draggable={false}
          />
        )}
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
            style={{ backgroundColor: groupColor + '33', color: groupColor }}
          >
            {avatarType === 'emoji' && avatarValue ? (
              <span className="text-xl">{avatarValue}</span>
            ) : (
              <span className="text-xs font-bold">{displayAvatar}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-fadenbrett-text">
              {title || 'Untitled'}
            </h3>
            {eraLabel && (
              <span className="text-xs text-fadenbrett-muted">{eraLabel}</span>
            )}
          </div>
        </div>

        {description && (
          <p className="mt-2 line-clamp-2 text-xs text-fadenbrett-muted">{description}</p>
        )}

        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-fadenbrett-muted/20 px-2 py-0.5 text-[10px] text-fadenbrett-muted"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] text-fadenbrett-muted">+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(CardNodeComponent)
