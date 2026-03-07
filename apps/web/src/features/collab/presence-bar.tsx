import { useState } from 'react'
import { useBoardStore } from '../../store/board-store'

export function PresenceBar() {
  const localUser = useBoardStore((s) => s.localUser)
  const remoteUsers = useBoardStore((s) => s.remoteUsers)
  const collaborating = useBoardStore((s) => s.collaborating)
  const startCollab = useBoardStore((s) => s.startCollab)
  const stopCollab = useBoardStore((s) => s.stopCollab)
  const setLocalUserName = useBoardStore((s) => s.setLocalUserName)

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(localUser.name)

  const remoteList = Object.values(remoteUsers)

  const commitName = () => {
    const trimmed = nameInput.trim()
    if (trimmed) setLocalUserName(trimmed)
    setEditingName(false)
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Remote user avatars */}
      {collaborating && remoteList.length > 0 && (
        <div className="flex -space-x-1.5">
          {remoteList.slice(0, 4).map((u) => (
            <div
              key={u.id}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-fadenbrett-surface"
              style={{ backgroundColor: u.color }}
              title={u.name}
            >
              {u.name.charAt(0)}
            </div>
          ))}
          {remoteList.length > 4 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-fadenbrett-muted/40 text-[10px] font-bold text-fadenbrett-text ring-2 ring-fadenbrett-surface">
              +{remoteList.length - 4}
            </div>
          )}
        </div>
      )}

      {/* Local avatar (clickable to rename) */}
      {collaborating && (
        <div className="relative">
          {editingName ? (
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false) }}
              className="h-6 w-28 rounded bg-fadenbrett-bg px-1.5 text-xs text-fadenbrett-text outline-none ring-1 ring-fadenbrett-accent/50"
            />
          ) : (
            <button
              onClick={() => { setNameInput(localUser.name); setEditingName(true) }}
              className="flex h-6 items-center gap-1 rounded-full px-1.5 text-[10px] font-semibold text-white ring-2 ring-fadenbrett-surface hover:opacity-80"
              style={{ backgroundColor: localUser.color }}
              title="Clique para renomear"
            >
              {localUser.name.charAt(0)}
              <span className="max-w-[60px] truncate">{localUser.name}</span>
            </button>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={collaborating ? stopCollab : startCollab}
        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
          collaborating
            ? 'bg-green-500/20 text-green-400 hover:bg-red-500/10 hover:text-red-400'
            : 'text-fadenbrett-muted hover:bg-fadenbrett-muted/10 hover:text-fadenbrett-text'
        }`}
        title={collaborating ? 'Parar colaboração' : 'Iniciar colaboração entre abas'}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" strokeLinecap="round" />
        </svg>
        {collaborating ? (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            {remoteList.length > 0 ? `${remoteList.length + 1} online` : 'Aguardando…'}
          </span>
        ) : (
          'Colaborar'
        )}
      </button>
    </div>
  )
}
