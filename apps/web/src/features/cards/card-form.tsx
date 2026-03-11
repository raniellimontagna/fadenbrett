import { useState, useCallback, useRef, useMemo } from 'react'
import { type CardData, type CustomField, type CustomFieldType, GROUP_COLORS } from './types'
import { apiUploadImage } from '../../lib/api-client'
import { MarkdownRenderer } from '../../components/markdown-renderer'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB - enforced server-side too

interface CardFormProps {
  initial: CardData
  onSave: (data: Omit<CardData, 'id'>) => void
  onCancel: () => void
  onDelete?: () => void
  /** Suggested field definitions from other cards in the board */
  fieldSuggestions?: Array<{ key: string; type: CustomFieldType }>
}

export function CardForm({ initial, onSave, onCancel, onDelete, fieldSuggestions }: CardFormProps) {
  const [title, setTitle] = useState(initial.title)
  const [description, setDescription] = useState(initial.description)
  const [avatarType, setAvatarType] = useState(initial.avatarType)
  const [avatarValue, setAvatarValue] = useState(initial.avatarValue)
  const [tagsInput, setTagsInput] = useState(initial.tags.join(', '))
  const [eraLabel, setEraLabel] = useState(initial.eraLabel)
  const [groupColor, setGroupColor] = useState(initial.groupColor)
  const [imageUrl, setImageUrl] = useState(initial.imageUrl ?? '')
  const [customFields, setCustomFields] = useState<CustomField[]>(initial.customFields ?? [])
  const [imageDragOver, setImageDragOver] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { setImageError('Somente imagens são suportadas.'); return }
    if (file.size > MAX_IMAGE_SIZE) { setImageError('Imagem muito grande. Limite: 5MB.'); return }
    setImageError(null)
    setImageUploading(true)
    try {
      const url = await apiUploadImage(file)
      setImageUrl(url)
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Erro ao fazer upload')
    } finally {
      setImageUploading(false)
    }
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) { void loadImageFile(file); e.target.value = '' }
    },
    [loadImageFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setImageDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file) void loadImageFile(file)
    },
    [loadImageFile],
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!title.trim()) return
      const validFields = customFields.filter((f) => f.key.trim())
      onSave({
        title: title.trim(),
        description: description.trim(),
        avatarType,
        avatarValue: avatarValue.trim(),
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        eraLabel: eraLabel.trim(),
        groupColor,
        imageUrl,
        customFields: validFields.length > 0 ? validFields : undefined,
      })
    },
    [title, description, avatarType, avatarValue, tagsInput, eraLabel, groupColor, imageUrl, customFields, onSave],
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onCancel}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[95svh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-fadenbrett-muted/30 bg-fadenbrett-surface shadow-2xl sm:max-h-[90vh] sm:w-96 sm:rounded-lg sm:border"
      >
        <div className="overflow-y-auto p-5">
          <h2 className="mb-4 text-lg font-semibold text-fadenbrett-text">
            {initial.title ? 'Editar Card' : 'Novo Card'}
          </h2>

          <div className="space-y-3">
            {/* Image upload */}
            <div>
              <label className="mb-1 block text-xs text-fadenbrett-muted">Imagem de referência</label>
              {imageError && (
                <p className="mb-1 text-xs text-red-400">{imageError}</p>
              )}
              {imageUrl ? (
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt="preview"
                    className="h-32 w-full rounded border border-fadenbrett-muted/30 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => { setImageUrl(''); setImageError(null) }}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    title="Remover imagem"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setImageDragOver(true) }}
                  onDragLeave={() => setImageDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !imageUploading && fileInputRef.current?.click()}
                  className={`flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded border-2 border-dashed transition-colors ${
                    imageDragOver
                      ? 'border-fadenbrett-accent bg-fadenbrett-accent/10'
                      : 'border-fadenbrett-muted/30 hover:border-fadenbrett-muted/60'
                  }`}
                >
                  {imageUploading ? (
                    <>
                      <svg className="h-5 w-5 animate-spin text-fadenbrett-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      <span className="text-[10px] text-fadenbrett-muted">Enviando…</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 text-fadenbrett-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span className="text-[10px] text-fadenbrett-muted">Clique ou arraste (max 5MB)</span>
                    </>
                  )}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            <div>
              <label className="mb-1 block text-xs text-fadenbrett-muted">Título *</label>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome do personagem ou elemento"
                className="w-full rounded border border-fadenbrett-muted/30 bg-fadenbrett-bg px-3 py-1.5 text-sm text-fadenbrett-text outline-none focus:border-fadenbrett-accent"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs text-fadenbrett-muted">Descrição</label>
                <span className="text-[10px] text-fadenbrett-muted/60">Markdown suportado</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notas, teorias, detalhes... (suporta **negrito**, *itálico*, listas, links)"
                rows={3}
                className="w-full resize-none rounded border border-fadenbrett-muted/30 bg-fadenbrett-bg px-3 py-1.5 text-sm text-fadenbrett-text outline-none focus:border-fadenbrett-accent"
              />
              {description.trim() && (
                <div className="mt-1.5 rounded border border-fadenbrett-muted/15 bg-fadenbrett-bg/50 p-2.5 text-sm text-fadenbrett-text">
                  <MarkdownRenderer content={description} />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-fadenbrett-muted">Avatar</label>
                <div className="flex gap-2">
                  <select
                    value={avatarType}
                    onChange={(e) => setAvatarType(e.target.value as 'emoji' | 'initials')}
                    className="rounded border border-fadenbrett-muted/30 bg-fadenbrett-bg px-2 py-1.5 text-sm text-fadenbrett-text outline-none"
                  >
                    <option value="emoji">Emoji</option>
                    <option value="initials">Iniciais</option>
                  </select>
                  <input
                    value={avatarValue}
                    onChange={(e) => setAvatarValue(e.target.value)}
                    placeholder={avatarType === 'emoji' ? 'ex: 🕵️' : 'ex: JD'}
                    className="min-w-0 flex-1 rounded border border-fadenbrett-muted/30 bg-fadenbrett-bg px-3 py-1.5 text-sm text-fadenbrett-text outline-none focus:border-fadenbrett-accent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-fadenbrett-muted">Tags (vírgula separadas)</label>
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="protagonista, temporada 1, mistério"
                className="w-full rounded border border-fadenbrett-muted/30 bg-fadenbrett-bg px-3 py-1.5 text-sm text-fadenbrett-text outline-none focus:border-fadenbrett-accent"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-fadenbrett-muted">Era / Período</label>
              <input
                value={eraLabel}
                onChange={(e) => setEraLabel(e.target.value)}
                placeholder="ex: 1986, Temporada 2, Ato III"
                className="w-full rounded border border-fadenbrett-muted/30 bg-fadenbrett-bg px-3 py-1.5 text-sm text-fadenbrett-text outline-none focus:border-fadenbrett-accent"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-fadenbrett-muted">Cor do grupo</label>
              <div className="flex gap-2">
                {GROUP_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setGroupColor(color)}
                    className={`h-6 w-6 rounded-full border-2 transition-transform ${
                      groupColor === color ? 'scale-125 border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            {/* Custom fields */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs text-fadenbrett-muted">Campos customizados</label>
                <button
                  type="button"
                  onClick={() => setCustomFields((f) => [...f, { key: '', value: '', type: 'text' }])}
                  className="text-[10px] text-fadenbrett-accent hover:underline"
                >
                  + Adicionar campo
                </button>
              </div>
              {customFields.length > 0 && (
                <div className="space-y-2">
                  {customFields.map((field, idx) => (
                    <CustomFieldRow
                      key={idx}
                      field={field}
                      suggestions={fieldSuggestions}
                      onChange={(updated) => {
                        setCustomFields((prev) => prev.map((f, i) => (i === idx ? updated : f)))
                      }}
                      onRemove={() => {
                        setCustomFields((prev) => prev.filter((_, i) => i !== idx))
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-fadenbrett-muted/20 px-5 py-3">
          <div>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded px-3 py-1.5 text-sm text-red-400 hover:bg-red-400/10"
              >
                Excluir
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded px-3 py-1.5 text-sm text-fadenbrett-muted hover:text-fadenbrett-text"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="rounded bg-fadenbrett-accent px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
            >
              Salvar
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Custom field row sub-component
// ---------------------------------------------------------------------------

const FIELD_TYPES: Array<{ value: CustomFieldType; label: string }> = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'boolean', label: 'Sim/Não' },
  { value: 'link', label: 'Link' },
]

function CustomFieldRow({
  field,
  suggestions,
  onChange,
  onRemove,
}: {
  field: CustomField
  suggestions?: Array<{ key: string; type: CustomFieldType }>
  onChange: (f: CustomField) => void
  onRemove: () => void
}) {
  const suggestedKeys = useMemo(() => {
    if (!suggestions) return []
    return [...new Set(suggestions.map((s) => s.key))]
  }, [suggestions])

  const handleKeyChange = (newKey: string) => {
    // Auto-set type from suggestions if exact match
    const match = suggestions?.find((s) => s.key === newKey)
    if (match) {
      onChange({ ...field, key: newKey, type: match.type })
    } else {
      onChange({ ...field, key: newKey })
    }
  }

  const renderValueInput = () => {
    const baseClass = 'min-w-0 flex-1 rounded border border-fadenbrett-muted/30 bg-fadenbrett-bg px-2 py-1 text-xs text-fadenbrett-text outline-none focus:border-fadenbrett-accent'

    switch (field.type) {
      case 'boolean':
        return (
          <button
            type="button"
            onClick={() => onChange({ ...field, value: field.value === 'true' ? 'false' : 'true' })}
            className={`flex h-7 items-center gap-1.5 rounded border px-2 text-xs transition-colors ${
              field.value === 'true'
                ? 'border-green-500/40 bg-green-500/10 text-green-400'
                : 'border-fadenbrett-muted/30 bg-fadenbrett-bg text-fadenbrett-muted'
            }`}
          >
            <span className={`inline-block h-3 w-3 rounded-sm border ${
              field.value === 'true' ? 'border-green-500 bg-green-500' : 'border-fadenbrett-muted/50'
            }`} />
            {field.value === 'true' ? 'Sim' : 'Não'}
          </button>
        )
      case 'number':
        return (
          <input
            type="number"
            value={field.value}
            onChange={(e) => onChange({ ...field, value: e.target.value })}
            className={baseClass}
            placeholder="0"
          />
        )
      case 'date':
        return (
          <input
            type="date"
            value={field.value}
            onChange={(e) => onChange({ ...field, value: e.target.value })}
            className={baseClass}
          />
        )
      case 'link':
        return (
          <input
            type="url"
            value={field.value}
            onChange={(e) => onChange({ ...field, value: e.target.value })}
            className={baseClass}
            placeholder="https://..."
          />
        )
      default:
        return (
          <input
            type="text"
            value={field.value}
            onChange={(e) => onChange({ ...field, value: e.target.value })}
            className={baseClass}
            placeholder="Valor"
            maxLength={500}
          />
        )
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative min-w-0 flex-1">
        <input
          type="text"
          value={field.key}
          onChange={(e) => handleKeyChange(e.target.value)}
          className="w-full rounded border border-fadenbrett-muted/30 bg-fadenbrett-bg px-2 py-1 text-xs text-fadenbrett-text outline-none focus:border-fadenbrett-accent"
          placeholder="Nome"
          maxLength={50}
          list="field-suggestions"
        />
        {suggestedKeys.length > 0 && (
          <datalist id="field-suggestions">
            {suggestedKeys.map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
        )}
      </div>
      <select
        value={field.type}
        onChange={(e) => onChange({ ...field, type: e.target.value as CustomFieldType, value: e.target.value === 'boolean' ? 'false' : '' })}
        className="rounded border border-fadenbrett-muted/30 bg-fadenbrett-bg px-1 py-1 text-[10px] text-fadenbrett-text outline-none"
      >
        {FIELD_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      {renderValueInput()}
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded p-0.5 text-fadenbrett-muted hover:text-red-400"
        title="Remover campo"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
