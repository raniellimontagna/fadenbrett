import { useCallback, useState } from 'react'
import {
  type ConnectionData,
  type ConnectionStyle,
  type RouteType,
  type ConnectionDirection,
  CONNECTION_STYLES,
  CONNECTION_COLORS,
  ROUTE_TYPES,
  DIRECTION_TYPES,
  RELATION_TYPES,
} from './types'

interface ConnectionFormProps {
  initial: ConnectionData
  onSave: (data: ConnectionData) => void
  onCancel: () => void
  onDelete?: () => void
}

export function ConnectionForm({ initial, onSave, onCancel, onDelete }: ConnectionFormProps) {
  const [label, setLabel] = useState(initial.label)
  const [style, setStyle] = useState<ConnectionStyle>(initial.style)
  const [color, setColor] = useState(initial.color)
  const [routeType, setRouteType] = useState<RouteType>(initial.routeType ?? 'bezier')
  const [curvature, setCurvature] = useState(Math.round((initial.curvature ?? 0.3) * 100))
  const [direction, setDirection] = useState<ConnectionDirection>(initial.direction ?? 'none')
  const [relationType, setRelationType] = useState<string | undefined>(initial.relationType)

  function applyRelationType(id: string) {
    const rt = RELATION_TYPES.find((r) => r.id === id)
    if (!rt) {
      setRelationType(undefined)
      return
    }
    setRelationType(rt.id)
    // Auto-fill label (if currently empty or matches another relation type's label)
    const currentIsRelationLabel = RELATION_TYPES.some((r) => r.label === label)
    if (!label || currentIsRelationLabel) setLabel(rt.label)
    // Auto-fill color
    setColor(rt.defaultColor)
    setStyle(rt.defaultStyle)
  }

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      onSave({ label, style, color, routeType, curvature: curvature / 100, direction, relationType })
    },
    [label, style, color, routeType, curvature, direction, relationType, onSave],
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onCancel}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="max-h-[90svh] w-full overflow-y-auto rounded-t-2xl border-t border-fadenbrett-muted/30 bg-fadenbrett-surface p-4 shadow-xl sm:w-80 sm:rounded-lg sm:border"
      >
        <h2 className="mb-4 text-sm font-semibold text-fadenbrett-text">Edit Connection</h2>

        {/* Relation type presets */}
        <div className="mb-3">
          <label className="mb-1 block text-xs text-fadenbrett-muted">Tipo de relação</label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => { setRelationType(undefined) }}
              className={`rounded border px-2 py-1 text-xs transition-colors ${
                !relationType
                  ? 'border-fadenbrett-accent bg-fadenbrett-accent/20 text-fadenbrett-text'
                  : 'border-fadenbrett-muted/30 text-fadenbrett-muted hover:border-fadenbrett-muted/60'
              }`}
            >
              Custom
            </button>
            {RELATION_TYPES.map((rt) => (
              <button
                key={rt.id}
                type="button"
                onClick={() => applyRelationType(rt.id)}
                className={`rounded border px-2 py-1 text-xs transition-colors ${
                  relationType === rt.id
                    ? 'border-fadenbrett-accent bg-fadenbrett-accent/20 text-fadenbrett-text'
                    : 'border-fadenbrett-muted/30 text-fadenbrett-muted hover:border-fadenbrett-muted/60'
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-xs text-fadenbrett-muted">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. family, suspect, ally..."
            className="w-full rounded border border-fadenbrett-muted/30 bg-fadenbrett-bg px-2 py-1.5 text-sm text-fadenbrett-text outline-none focus:border-fadenbrett-accent"
            autoFocus
          />
        </div>

        {/* Direction */}
        <div className="mb-3">
          <label className="mb-1 block text-xs text-fadenbrett-muted">Direção</label>
          <div className="flex gap-1.5">
            {DIRECTION_TYPES.map((d) => (
              <button
                key={d.value}
                type="button"
                title={d.title}
                onClick={() => setDirection(d.value)}
                className={`flex-1 rounded border px-2 py-1.5 text-xs font-mono transition-colors ${
                  direction === d.value
                    ? 'border-fadenbrett-accent bg-fadenbrett-accent/20 text-fadenbrett-text'
                    : 'border-fadenbrett-muted/30 text-fadenbrett-muted hover:border-fadenbrett-muted/60'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-xs text-fadenbrett-muted">Style</label>
          <div className="flex gap-2">
            {CONNECTION_STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStyle(s.value)}
                className={`flex-1 rounded border px-2 py-1.5 text-xs transition-colors ${
                  style === s.value
                    ? 'border-fadenbrett-accent bg-fadenbrett-accent/20 text-fadenbrett-text'
                    : 'border-fadenbrett-muted/30 text-fadenbrett-muted hover:border-fadenbrett-muted/60'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-xs text-fadenbrett-muted">Tipo de rota</label>
          <div className="flex gap-2">
            {ROUTE_TYPES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRouteType(r.value)}
                className={`flex-1 rounded border px-2 py-1.5 text-xs transition-colors ${
                  routeType === r.value
                    ? 'border-fadenbrett-accent bg-fadenbrett-accent/20 text-fadenbrett-text'
                    : 'border-fadenbrett-muted/30 text-fadenbrett-muted hover:border-fadenbrett-muted/60'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {routeType === 'bezier' && (
          <div className="mb-3">
            <label className="mb-1 flex items-center justify-between text-xs text-fadenbrett-muted">
              <span>Curvatura</span>
              <span className="text-fadenbrett-text">{curvature}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={curvature}
              onChange={(e) => setCurvature(Number(e.target.value))}
              className="w-full accent-fadenbrett-accent"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-xs text-fadenbrett-muted">Color</label>
          <div className="flex flex-wrap gap-2">
            {CONNECTION_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full border-2 transition-transform ${
                  color === c ? 'scale-125 border-white' : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded bg-fadenbrett-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-fadenbrett-accent/80"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded border border-fadenbrett-muted/30 px-3 py-1.5 text-xs text-fadenbrett-muted hover:bg-fadenbrett-muted/10"
          >
            Cancel
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded border border-red-800/50 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/20"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
