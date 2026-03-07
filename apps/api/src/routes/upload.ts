import type { FastifyInstance } from 'fastify'
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), 'data', 'uploads')

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_BYTES = 5 * 1024 * 1024 // 5MB

export async function uploadRoutes(app: FastifyInstance): Promise<void> {
  // Ensure upload directory exists before handling requests
  await mkdir(UPLOAD_DIR, { recursive: true })

  app.post('/upload', async (req, reply) => {
    const data = await req.file()
    if (!data) return reply.status(400).send({ error: 'No file uploaded' })

    if (!ALLOWED_TYPES.has(data.mimetype)) {
      return reply.status(415).send({ error: 'Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.' })
    }

    const chunks: Buffer[] = []
    for await (const chunk of data.file) {
      chunks.push(chunk as Buffer)
    }
    const buffer = Buffer.concat(chunks)

    if (buffer.length > MAX_BYTES) {
      return reply.status(413).send({ error: 'Arquivo muito grande. Limite: 5MB.' })
    }

    // Use SHA256 of content as filename to deduplicate
    const ext = data.mimetype === 'image/jpeg' ? 'jpg' : data.mimetype.split('/')[1]
    const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 40)
    const filename = `${hash}.${ext}`

    await writeFile(join(UPLOAD_DIR, filename), buffer)

    return reply.status(201).send({ url: `/uploads/${filename}` })
  })
}
