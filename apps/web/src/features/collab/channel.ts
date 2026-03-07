import type { CollabMessage } from './types'

// Derive WebSocket base URL from VITE_API_URL (http→ws, https→wss).
// When VITE_API_URL is empty (production behind Nginx), derive from window.location.
const _apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001'
const WS_BASE = _apiBase
  ? _apiBase.replace(/^http/, 'ws')
  : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`

type Listener = (msg: CollabMessage) => void

class CollabChannel {
  private ws: WebSocket | null = null
  private listeners = new Set<Listener>()
  private boardId = ''
  private reconnectDelay = 1000
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private closed = false

  open(boardId: string) {
    if (this.ws?.readyState === WebSocket.OPEN && this.boardId === boardId) return
    this.closed = false
    this.boardId = boardId
    this._connect()
  }

  private _connect() {
    const url = `${WS_BASE}/ws/boards/${this.boardId}`
    const ws = new WebSocket(url)
    this.ws = ws

    ws.onopen = () => {
      this.reconnectDelay = 1000 // reset backoff on success
    }

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string) as CollabMessage
        for (const l of this.listeners) l(msg)
      } catch { /* ignore malformed messages */ }
    }

    ws.onclose = () => {
      if (this.closed) return
      // Exponential backoff: 1s → 2s → 4s → … → 30s max
      this.reconnectTimer = setTimeout(() => {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000)
        this._connect()
      }, this.reconnectDelay)
    }

    ws.onerror = () => {
      ws.close() // triggers onclose which handles reconnect
    }
  }

  close() {
    this.closed = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
  }

  send(msg: CollabMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
}

// Singleton — shared across the app
export const collabChannel = new CollabChannel()
