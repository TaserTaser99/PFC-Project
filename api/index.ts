import type { IncomingMessage, ServerResponse } from 'node:http'
import { migrate, seedIfEmpty } from '../src/db.js'
import { app } from '../src/server.js'

// Vercel functions run on an ephemeral filesystem, so the JSON store lives in
// /tmp and must be recreated (and reseeded with demo data) on each cold start.
let ready: Promise<void> | undefined

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  ready ??= migrate().then(() => seedIfEmpty())
  await ready
  app(req as never, res as never)
}
