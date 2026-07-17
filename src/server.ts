import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { migrate } from './db.js'
import { router } from './routes.js'

export const app = express()
app.disable('x-powered-by')

const allowedOrigin = process.env.CORS_ORIGIN?.trim()
if (allowedOrigin) {
  app.use(cors({ origin: allowedOrigin }))
}

app.use(express.json({ limit: '50kb' }))

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const publicPath = path.resolve(dirname, '../public')

app.use(express.static(publicPath))
app.use('/api', router)

app.get('/', (_req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'))
})

app.use((_req, res) => {
  res.status(404).json({ error: 'not_found' })
})

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error)
  res.status(500).json({ error: 'internal_server_error' })
})

const port = Number(process.env.PORT ?? 3002)

async function start() {
  await migrate()
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
  })
}

void start().catch((error) => {
  console.error('Failed to start server:', error)
  process.exitCode = 1
})
