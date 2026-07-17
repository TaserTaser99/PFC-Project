import type { NextFunction, Request, Response } from 'express'
import { getUserById } from '../services/userService.js'

// This is a development-only identity switch for the pitch prototype.
// It must be replaced with real authentication before public onboarding.
export async function devAuth(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'production' || process.env.DEV_AUTH !== 'true') {
    res.status(401).json({
      error: 'dev_auth_disabled',
      message: 'Development authentication is not enabled'
    })
    return
  }

  const userId = String(req.header('x-user-id') ?? '').trim()
  if (!userId) {
    res.status(401).json({
      error: 'unauthenticated',
      message: 'Missing X-User-Id header for development authentication'
    })
    return
  }

  try {
    const user = await getUserById(userId)
    if (!user) {
      res.status(401).json({ error: 'unknown_user', message: 'Unknown development user' })
      return
    }

    res.locals.userId = userId
    next()
  } catch (error) {
    next(error)
  }
}
