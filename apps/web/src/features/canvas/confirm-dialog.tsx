interface ConfirmDialogProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-80 rounded-lg border border-fadenbrett-muted/30 bg-fadenbrett-surface p-5 shadow-2xl"
      >
        <p className="mb-4 text-sm text-fadenbrett-text">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded px-3 py-1.5 text-sm text-fadenbrett-muted hover:text-fadenbrett-text"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded bg-red-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
