import {
  Router,
  type NextFunction,
  type Request,
  type Response
} from 'express'

import { courses } from './data/sampleData.js'
import { degreePlans } from './data/degreePlans.js'
import { readUsers } from './db.js'
import { buildHeatmapCourses } from './Heatmap.js'
import { devAuth } from './middleware/authStub.js'
import {
  recommendCoursesForUser,
  recommendSharedSchedule
} from './recommendation.js'
import { login, signup } from './services/authService.js'

import {
  acceptFriendRequest,
  cancelOutgoingRequest,
  declineFriendRequest,
  getFriendDataFor,
  getFriendIdsForUser,
  removeFriend,
  sendFriendRequest
} from './services/friendService.js'
import {
  getProgramOrThrow,
  getUserProgression,
  listPrograms,
  removeCourseStatus,
  setCourseStatus,
  setUserProgram
} from './services/progressionService.js'
import {
  getPublicUserById,
  searchUsers,
  updateUserCompletedCourse,
  updateUserDegree,
  updateUserPlannedCourse
} from './services/userService.js'

import type {
  CourseStatus,
  RecommendationRequest,
  SharedRecommendationRequest
} from './models.js'

export const router = Router()

type Term = '1' | '2' | '3'

const HEATMAP_LIMIT = 12
const MAX_PLANNED_COURSES_PER_TERM = 4

const validTerms = new Set<Term>(['1', '2', '3'])

function isValidTerm(value: string): value is Term {
  return validTerms.has(value as Term)
}

type AsyncRoute = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>

function asyncRoute(handler: AsyncRoute) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    void handler(req, res, next).catch(next)
  }
}

function sendDomainError(
  res: Response,
  error: unknown
) {
  const code =
    error instanceof Error
      ? error.message
      : 'unknown_error'

  const statusByCode: Record<string, number> = {
    cannot_friend_self: 400,
    email_in_use: 409,
    invalid_credentials: 401,
    invalid_degree: 400,
    invalid_course: 400,
    invalid_email: 400,
    invalid_name: 400,
    invalid_password: 400,
    invalid_term: 400,
    invalid_state: 409,
    plan_limit_exceeded: 409,
    course_not_offered_in_term: 409,
    already_friends: 409,
    not_authorised: 403,
    not_friends: 404,
    request_not_found: 404,
    user_not_found: 404,
    program_not_found: 404,
    no_program_selected: 400
  }

  res
    .status(statusByCode[code] ?? 400)
    .json({ error: code })
}

async function sendHeatmapForUser(
  res: Response,
  userId: string,
  term: Term,
  limit: number
) {
  const users = await readUsers()

  const user = users.find(
    (candidate) => candidate.id === userId
  )

  if (!user) {
    res.status(404).json({
      error: 'user_not_found'
    })
    return
  }

  const userDegreePlan = degreePlans.find(
    (plan) =>
      plan.id === user.degree ||
      plan.label === user.degree
  )

  const allowedCourseIds = userDegreePlan
    ? new Set(userDegreePlan.courseIds)
    : new Set(user.degreeCourseIds ?? [])

  const completedCourseIds = new Set(
    user.completedCourseIds ?? []
  )

  const friendIds =
    await getFriendIdsForUser(userId)

  const coursesInTerm = courses.filter(
    (course) =>
      course.terms.includes(term) &&
      allowedCourseIds.has(course.id) &&
      !completedCourseIds.has(course.id)
  )

  const friendCourseIds = users
    .filter((candidate) =>
      friendIds.includes(candidate.id)
    )
    .map((friend) => {
      const plannedInTerm =
        friend.plannedCourses?.[term] ?? []

      return plannedInTerm.filter((courseId) =>
        allowedCourseIds.has(courseId)
      )
    })

  const plannedCourseIds = (
    user.plannedCourses?.[term] ?? []
  ).filter((courseId) =>
    allowedCourseIds.has(courseId)
  )

  res.json({
    userId,
    term,
    limit,
    maxPlannedCourses:
      MAX_PLANNED_COURSES_PER_TERM,
    plannedCourseIds,
    courses: buildHeatmapCourses(
      coursesInTerm,
      friendCourseIds,
      limit
    )
  })
}

/* ============================================================
   PUBLIC COURSE AND DEGREE INFORMATION
   ============================================================ */

router.get('/courses', (_req, res) => {
  res.json(courses)
})

router.get('/degree-plans', (_req, res) => {
  res.json(degreePlans)
})

/* ============================================================
   AUTHENTICATION
   ============================================================ */

router.post(
  '/auth/signup',
  asyncRoute(async (req, res) => {
    try {
      const result = await signup(
        String(req.body?.name ?? ''),
        String(req.body?.email ?? ''),
        String(req.body?.password ?? ''),
        String(req.body?.degree ?? '')
      )

      res.status(201).json(result)
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

router.post(
  '/auth/login',
  asyncRoute(async (req, res) => {
    try {
      const result = await login(
        String(req.body?.email ?? ''),
        String(req.body?.password ?? '')
      )

      res.json(result)
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

/* ============================================================
   USER SEARCH

   This is only for intentionally searching for a person to add
   as a friend. There is no general user-directory endpoint.
   ============================================================ */

router.get(
  '/users/search',
  devAuth,
  asyncRoute(async (req, res) => {
    const query = String(
      req.query.q ?? ''
    ).trim()

    if (query.length < 2) {
      res.status(400).json({
        error: 'invalid_query',
        message:
          'Enter at least two characters to search'
      })
      return
    }

    res.json(await searchUsers(query, 20))
  })
)

/*
 * This preserves the existing degree-update endpoint, but users
 * can now only update their own account.
 */
router.patch(
  '/users/:id/degree',
  devAuth,
  asyncRoute(async (req, res) => {
    const authenticatedUserId = String(
      res.locals.userId
    )

    const requestedUserId = String(
      req.params.id ?? ''
    )

    if (
      authenticatedUserId !== requestedUserId
    ) {
      res.status(403).json({
        error: 'not_authorised'
      })
      return
    }

    try {
      const updatedUser =
        await updateUserDegree(
          authenticatedUserId,
          String(
            req.body?.degreePlanId ?? ''
          )
        )

      res.json(updatedUser)
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

/* ============================================================
   FRIEND ROUTES
   ============================================================ */

const friendRouter = Router()

friendRouter.use(devAuth)

friendRouter.get(
  '/',
  asyncRoute(async (_req, res) => {
    try {
      const friendData =
        await getFriendDataFor(
          String(res.locals.userId)
        )

      res.json(friendData)
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

friendRouter.post(
  '/requests',
  asyncRoute(async (req, res) => {
    const targetId = String(
      req.body?.targetId ?? ''
    ).trim()

    if (!targetId) {
      res.status(400).json({
        error: 'invalid_target',
        message: 'Friend target is required'
      })
      return
    }

    try {
      const request =
        await sendFriendRequest(
          String(res.locals.userId),
          targetId
        )

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
      const request =
        await acceptFriendRequest(
          String(req.params.id ?? ''),
          String(res.locals.userId)
        )

      res.json(request)
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

friendRouter.post(
  '/requests/:id/decline',
  asyncRoute(async (req, res) => {
    try {
      const request =
        await declineFriendRequest(
          String(req.params.id ?? ''),
          String(res.locals.userId)
        )

      res.json(request)
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

friendRouter.post(
  '/requests/:id/cancel',
  asyncRoute(async (req, res) => {
    try {
      const request =
        await cancelOutgoingRequest(
          String(req.params.id ?? ''),
          String(res.locals.userId)
        )

      res.json(request)
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

friendRouter.delete(
  '/:otherId',
  asyncRoute(async (req, res) => {
    try {
      await removeFriend(
        String(res.locals.userId),
        String(req.params.otherId ?? '')
      )

      res.status(204).send()
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

router.use('/friends', friendRouter)

/* ============================================================
   CURRENT USER ROUTES
   ============================================================ */

const meRouter = Router()

meRouter.use(devAuth)

meRouter.get(
  '/',
  asyncRoute(async (_req, res) => {
    const user = await getPublicUserById(String(res.locals.userId))

    if (!user) {
      res.status(404).json({
        error: 'user_not_found'
      })
      return
    }

    res.json(user)
  })
)

/*
 * Returns all courses together with whether the logged-in user
 * has completed each course.
 */
meRouter.get(
  '/courses',
  asyncRoute(async (_req, res) => {
    const userId = String(
      res.locals.userId
    )

    const users = await readUsers()

    const user = users.find(
      (candidate) => candidate.id === userId
    )

    if (!user) {
      res.status(404).json({
        error: 'user_not_found'
      })
      return
    }

    const completedCourseIds = new Set(
      user.completedCourseIds ?? []
    )

    res.json(
      courses.map((course) => ({
        ...course,
        completed:
          completedCourseIds.has(course.id)
      }))
    )
  })
)

/*
 * Returns the logged-in user's completed and planned courses.
 */
meRouter.get(
  '/course-state',
  asyncRoute(async (_req, res) => {
    const userId = String(
      res.locals.userId
    )

    const users = await readUsers()

    const user = users.find(
      (candidate) => candidate.id === userId
    )

    if (!user) {
      res.status(404).json({
        error: 'user_not_found'
      })
      return
    }

    res.json({
      completedCourseIds:
        user.completedCourseIds ?? [],
      plannedCourses:
        user.plannedCourses ?? {
          '1': [],
          '2': [],
          '3': []
        }
    })
  })
)

/*
 * Returns the planner heatmap for one term. It also returns the
 * courses selected by the logged-in user so the frontend can
 * display them in blue.
 */
meRouter.get(
  '/heatmap',
  asyncRoute(async (req, res) => {
    const term = String(
      req.query.term ?? ''
    ).trim()

    if (!isValidTerm(term)) {
      res.status(400).json({
        error: 'invalid_term'
      })
      return
    }

    try {
      await sendHeatmapForUser(
        res,
        String(res.locals.userId),
        term,
        HEATMAP_LIMIT
      )
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

/*
 * Marks or unmarks a course as completed.
 *
 * Expected body:
 * {
 *   "completed": true
 * }
 */
meRouter.patch(
  '/completed-courses/:courseId',
  asyncRoute(async (req, res) => {
    const courseId = String(
      req.params.courseId ?? ''
    ).trim()

    const completed =
      req.body?.completed

    if (!courseId) {
      res.status(400).json({
        error: 'invalid_course'
      })
      return
    }

    if (typeof completed !== 'boolean') {
      res.status(400).json({
        error: 'invalid_state'
      })
      return
    }

    try {
      const updatedUser =
        await updateUserCompletedCourse(
          String(res.locals.userId),
          courseId,
          completed
        )

      res.json({
        completedCourseIds:
          updatedUser.completedCourseIds ?? [],
        plannedCourses:
          updatedUser.plannedCourses ?? {
            '1': [],
            '2': [],
            '3': []
          }
      })
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

/*
 * Adds or removes a course from a term plan.
 *
 * Expected body:
 * {
 *   "planned": true
 * }
 */
meRouter.patch(
  '/planned-courses/:term/:courseId',
  asyncRoute(async (req, res) => {
    const term = String(
      req.params.term ?? ''
    ).trim()

    const courseId = String(
      req.params.courseId ?? ''
    ).trim()

    const planned = req.body?.planned

    if (!isValidTerm(term)) {
      res.status(400).json({
        error: 'invalid_term'
      })
      return
    }

    if (!courseId) {
      res.status(400).json({
        error: 'invalid_course'
      })
      return
    }

    if (typeof planned !== 'boolean') {
      res.status(400).json({
        error: 'invalid_state'
      })
      return
    }

    try {
      const updatedUser = await updateUserPlannedCourse(
  String(res.locals.userId),
  term,
  courseId,
  planned
)

      res.json({
        term,
        maxPlannedCourses:
          MAX_PLANNED_COURSES_PER_TERM,
        plannedCourseIds:
          updatedUser.plannedCourses?.[
            term
          ] ?? []
      })
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

router.use('/me', meRouter)

/* ============================================================
   RECOMMENDATIONS
   ============================================================ */

router.post(
  '/recommendations',
  asyncRoute(async (req, res) => {
    const payload =
      req.body as Partial<RecommendationRequest>

    const userId = String(
      payload.userId ?? ''
    ).trim()

    const threshold = Number(
      payload.threshold
    )

    if (
      !userId ||
      !Number.isFinite(threshold)
    ) {
      res.status(400).json({
        error:
          'invalid_recommendation_request'
      })
      return
    }

    const users = await readUsers()

    if (
      !users.some(
        (user) => user.id === userId
      )
    ) {
      res.status(404).json({
        error: 'user_not_found'
      })
      return
    }

    const friendIds =
      await getFriendIdsForUser(userId)

    res.json(
      recommendCoursesForUser(
        userId,
        threshold,
        Array.isArray(
          payload.completedCourseIds
        )
          ? payload.completedCourseIds
          : [],
        users,
        friendIds
      )
    )
  })
)

router.get('/programs', (_req, res) => {
  res.json(listPrograms())
})

router.get('/programs/:code', (req, res) => {
  try {
    res.json(getProgramOrThrow(req.params.code))
  } catch (error) {
    sendDomainError(res, error)
  }
})

router.get(
  '/users/:id/progression',
  asyncRoute(async (req, res) => {
    try {
      res.json(await getUserProgression(req.params.id))
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

router.post(
  '/users/:id/program',
  asyncRoute(async (req, res) => {
    const programCode = String(req.body?.programCode ?? '').trim()
    if (!programCode) {
      res.status(400).json({ error: 'invalid_program_code' })
      return
    }

    try {
      res.json(await setUserProgram(req.params.id, programCode))
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

router.post(
  '/users/:id/courses',
  asyncRoute(async (req, res) => {
    const courseCode = String(req.body?.courseCode ?? '').trim()
    const status = String(req.body?.status ?? '') as CourseStatus
    if (!courseCode || !['completed', 'planned'].includes(status)) {
      res.status(400).json({ error: 'invalid_course_status_request' })
      return
    }

    try {
      res.status(201).json(await setCourseStatus(req.params.id, courseCode, status))
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

router.delete(
  '/users/:id/courses/:courseCode',
  asyncRoute(async (req, res) => {
    try {
      res.json(await removeCourseStatus(req.params.id, req.params.courseCode))
    } catch (error) {
      sendDomainError(res, error)
    }
  })
)

router.post(
  '/recommendations/shared',
  asyncRoute(async (req, res) => {
    const payload =
      req.body as Partial<SharedRecommendationRequest>

    const userIds = Array.isArray(
      payload.userIds
    )
      ? payload.userIds
          .map(String)
          .filter(Boolean)
      : []

    const threshold = Number(
      payload.threshold
    )

    if (
      userIds.length < 2 ||
      !Number.isFinite(threshold)
    ) {
      res.status(400).json({
        error:
          'invalid_shared_recommendation_request'
      })
      return
    }

    const users = await readUsers()

    const knownUserIds = new Set(
      users.map((user) => user.id)
    )

    if (
      userIds.some(
        (userId) =>
          !knownUserIds.has(userId)
      )
    ) {
      res.status(404).json({
        error: 'user_not_found'
      })
      return
    }

    res.json(
      recommendSharedSchedule(
        userIds,
        threshold,
        users
      )
    )
  })
)