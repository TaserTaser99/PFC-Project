import { Router, type NextFunction, type Request, type Response } from 'express'
import { courses } from './data/sampleData.js'
import { readUsers } from './db.js'
import { devAuth } from './middleware/authStub.js'
import { recommendCoursesForUser, recommendSharedSchedule } from './recommendation.js'
import {
  acceptFriendRequest,
  cancelOutgoingRequest,
  declineFriendRequest,
  getFriendDataFor,
  getFriendIdsForUser,
  removeFriend,
  sendFriendRequest
} from './services/friendService.js'
import { createUser, listPublicUsers, searchUsers } from './services/userService.js'
import type { RecommendationRequest, SharedRecommendationRequest } from './models.js'

export const router = Router()

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<unknown>

function asyncRoute(handler: AsyncRoute) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next)
  }
}

function sendDomainError(res: Response, error: unknown) {
  const code = error instanceof Error ? error.message : 'unknown_error'
  const statusByCode: Record<string, number> = {
    cannot_friend_self: 400,
    invalid_name: 400,
    invalid_state: 409,
    already_friends: 409,
    not_authorised: 403,
    not_friends: 404,
    request_not_found: 404,
    user_not_found: 404
  }
  res.status(statusByCode[code] ?? 400).json({ error: code })
}

router.get('/courses', (_req, res) => {
  res.json(courses)
})

router.get(
  '/users',
  asyncRoute(async (_req, res) => {
    res.json(await listPublicUsers())
  })
)

router.get(
  '/users/search',
  asyncRoute(async (req, res) => {
    const query = String(req.query.q ?? '').trim()
    if (query.length < 2) {
      res.status(400).json({
        error: 'invalid_query',
        message: 'Enter at least two characters to search'
      })
      return
    }
    res.json(await searchUsers(query, 20))
  })
)

router.post(
  '/users',
  asyncRoute(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({
        error: 'account_creation_disabled',
        message: 'Account creation is disabled in production'
      })
      return
    }

    try {
      res.status(201).json(await createUser(String(req.body?.name ?? '')))
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

const friendRouter = Router()
friendRouter.use(devAuth)

friendRouter.get(
  '/',
  asyncRoute(async (_req, res) => {
    try {
      res.json(await getFriendDataFor(String(res.locals.userId)))
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

friendRouter.post(
  '/requests',
  asyncRoute(async (req, res) => {
    const targetId = String(req.body?.targetId ?? '').trim()
    if (!targetId) {
      res.status(400).json({
        error: 'invalid_target',
        message: 'Friend target is required'
      })
      return
    }

    try {
      const request = await sendFriendRequest(String(res.locals.userId), targetId)
      res.status(201).json(request)
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

friendRouter.post(
  '/requests/:id/accept',
  asyncRoute(async (req, res) => {
    try {
      res.json(
        await acceptFriendRequest(String(req.params.id), String(res.locals.userId))
      )
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

friendRouter.post(
  '/requests/:id/decline',
  asyncRoute(async (req, res) => {
    try {
      res.json(
        await declineFriendRequest(String(req.params.id), String(res.locals.userId))
      )
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

friendRouter.post(
  '/requests/:id/cancel',
  asyncRoute(async (req, res) => {
    try {
      res.json(
        await cancelOutgoingRequest(String(req.params.id), String(res.locals.userId))
      )
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

friendRouter.delete(
  '/:otherId',
  asyncRoute(async (req, res) => {
    try {
      await removeFriend(String(res.locals.userId), String(req.params.otherId))
      res.status(204).send()
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

router.use('/friends', friendRouter)

router.post(
  '/recommendations',
  asyncRoute(async (req, res) => {
    const payload = req.body as Partial<RecommendationRequest>
    const userId = String(payload.userId ?? '').trim()
    const threshold = Number(payload.threshold)
    if (!userId || !Number.isFinite(threshold)) {
      res.status(400).json({ error: 'invalid_recommendation_request' })
      return
    }

    const users = await readUsers()
    if (!users.some((user) => user.id === userId)) {
      res.status(404).json({ error: 'user_not_found' })
      return
    }

    const friendIds = await getFriendIdsForUser(userId)
    res.json(
      recommendCoursesForUser(
        userId,
        threshold,
        Array.isArray(payload.completedCourseIds) ? payload.completedCourseIds : [],
        users,
        friendIds
      )
    )
  })
)

router.post(
  '/recommendations/shared',
  asyncRoute(async (req, res) => {
    const payload = req.body as Partial<SharedRecommendationRequest>
    const userIds = Array.isArray(payload.userIds)
      ? payload.userIds.map(String).filter(Boolean)
      : []
    const threshold = Number(payload.threshold)
    if (userIds.length < 2 || !Number.isFinite(threshold)) {
      res.status(400).json({ error: 'invalid_shared_recommendation_request' })
      return
    }

    const users = await readUsers()
    const knownUserIds = new Set(users.map((user) => user.id))
    if (userIds.some((userId) => !knownUserIds.has(userId))) {
      res.status(404).json({ error: 'user_not_found' })
      return
    }

    res.json(recommendSharedSchedule(userIds, threshold, users))
  })
)
