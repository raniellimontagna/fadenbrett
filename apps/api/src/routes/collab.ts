import type { FastifyInstance } from 'fastify'
import type { WebSocket } from 'ws'

// Room management: boardId → connected WebSocket clients
const rooms = new Map<string, Set<WebSocket>>()

export async function collabRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { boardId: string } }>(
    '/boards/:boardId',
    { websocket: true },
    (socket, req) => {
      const { boardId } = req.params

      // Join room
      if (!rooms.has(boardId)) rooms.set(boardId, new Set())
      const room = rooms.get(boardId)!
      room.add(socket as unknown as WebSocket)

      // Heartbeat — detect dead connections every 30s
      const heartbeat = setInterval(() => {
        if ((socket as unknown as WebSocket).readyState === 1 /* OPEN */) {
          ;(socket as unknown as WebSocket).ping()
        }
      }, 30_000)

      socket.on('message', (raw: Buffer | string) => {
        const text = raw.toString()
        // Rebroadcast to every OTHER client in the same room
        for (const client of room) {
          if (client !== (socket as unknown as WebSocket) && client.readyState === 1) {
            client.send(text)
          }
        }
      })

      socket.on('close', () => {
        clearInterval(heartbeat)
        room.delete(socket as unknown as WebSocket)
        if (room.size === 0) rooms.delete(boardId)
      })

      socket.on('error', () => {
        clearInterval(heartbeat)
        room.delete(socket as unknown as WebSocket)
        if (room.size === 0) rooms.delete(boardId)
      })
    },
  )
}
