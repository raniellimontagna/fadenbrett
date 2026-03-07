/**
 * Typed API client for the Fadenbrett backend.
 * Base URL is controlled via VITE_API_URL (default: http://localhost:3001).
 */

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API ${init?.method ?? 'GET'} ${path} → ${res.status}: ${text}`)
  }
  // 204 No Content
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApiBoard {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  snapshot: string | null
}

export interface ApiSnapshot {
  nodes: unknown[]
  edges: unknown[]
}

// ─── Board endpoints ──────────────────────────────────────────────────────────

export const apiListBoards = (): Promise<ApiBoard[]> =>
  apiFetch('/api/boards')

export const apiCreateBoard = (name: string, id?: string): Promise<ApiBoard> =>
  apiFetch('/api/boards', {
    method: 'POST',
    body: JSON.stringify({ name, ...(id ? { id } : {}) }),
  })

export const apiGetBoard = (id: string): Promise<ApiBoard & { cards: unknown[]; notes: unknown[]; connections: unknown[] }> =>
  apiFetch(`/api/boards/${id}`)

export const apiRenameBoard = (id: string, name: string): Promise<ApiBoard> =>
  apiFetch(`/api/boards/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })

export const apiDeleteBoard = (id: string): Promise<void> =>
  apiFetch(`/api/boards/${id}`, { method: 'DELETE' })

export const apiAutosave = (id: string, snapshot: ApiSnapshot): Promise<{ ok: boolean; savedAt: string }> =>
  apiFetch(`/api/boards/${id}/autosave`, {
    method: 'POST',
    body: JSON.stringify(snapshot),
  })

export const apiExportBoard = (id: string): Promise<unknown> =>
  apiFetch(`/api/boards/${id}/export`)

/**
 * Upload an image file to the server.
 * Returns an absolute URL to the uploaded image.
 */
export async function apiUploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE_URL}/upload`, { method: 'POST', body: form })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Upload falhou ${res.status}: ${text}`)
  }
  const { url } = await res.json() as { url: string }
  // url is a relative path like /uploads/hash.jpg — prepend base
  return `${BASE_URL}${url}`
}
