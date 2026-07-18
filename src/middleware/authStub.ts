import type { NextFunction, Request, Response } from 'express'
import { getUserById } from '../services/userService.js'

// Prototype auth middleware: trusts the selected user id provided by the client.
// Replace this with session or token-based authentication before production use.
export async function devAuth(req: Request, res: Response, next: NextFunction) {
  const userId = String(req.header('x-user-id') ?? '').trim()
  if (!userId) {
    res.status(401).json({
      error: 'unauthenticated',
      message: 'Missing X-User-Id header'
    })
    return
  }

  try {
    const user = await getUserById(userId)
    if (!user) {
      res.status(401).json({ error: 'unknown_user', message: 'Unknown user' })
      return
    }

    res.locals.userId = userId
    next()
  } catch (error) {
    next(error)
  }
}
