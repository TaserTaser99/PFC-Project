import { randomUUID } from 'node:crypto'

import { degreePlans } from '../data/degreePlans.js'
import { courses } from '../data/sampleData.js'
import {
  readUsers,
  withDbMutation,
  writeUsers
} from '../db.js'

import type {
  Term,
  UserProfile
} from '../models.js'

export type PublicUser = Pick<
  UserProfile,
  | 'id'
  | 'name'
  | 'preferredWorkload'
  | 'completedCourseIds'
  | 'degree'
  | 'degreeCourseIds'
  | 'plannedCourses'
>

export type SearchUser = Pick<
  UserProfile,
  'id' | 'name'
>

const DEFAULT_DEGREE =
  degreePlans[0]?.label ?? 'General Studies'

const DEFAULT_DEGREE_COURSE_IDS =
  degreePlans[0]?.courseIds ?? []

const MAX_PLANNED_COURSES_PER_TERM = 4

function toPublicUser(
  user: UserProfile
): PublicUser {
  return {
    id: user.id,
    name: user.name,
    preferredWorkload:
      user.preferredWorkload,
    completedCourseIds:
      user.completedCourseIds ?? [],
    degree:
      user.degree ?? DEFAULT_DEGREE,
    degreeCourseIds:
      user.degreeCourseIds?.length
        ? user.degreeCourseIds
        : DEFAULT_DEGREE_COURSE_IDS,
    plannedCourses:
      user.plannedCourses ?? {}
  }
}

function normalizeCourseId(
  courseId: string
): string {
  return courseId.trim()
}

function normalizeTerm(
  term: string
): Term {
  const normalizedTerm = term.trim()

  if (
    normalizedTerm === '1' ||
    normalizedTerm === '2' ||
    normalizedTerm === '3'
  ) {
    return normalizedTerm
  }

  throw new Error('invalid_term')
}

function findCourseOrThrow(
  courseId: string
) {
  const normalizedCourseId =
    normalizeCourseId(courseId)

  const course = courses.find(
    (candidate) =>
      candidate.id === normalizedCourseId
  )

  if (!course) {
    throw new Error('invalid_course')
  }

  return course
}

export async function listPublicUsers():
Promise<PublicUser[]> {
  const users = await readUsers()

  return users.map(toPublicUser)
}

export async function searchUsers(
  query: string,
  limit = 10
): Promise<SearchUser[]> {
  const users = await readUsers()

  const normalizedQuery = query
    .trim()
    .toLocaleLowerCase()

  if (!normalizedQuery) {
    return []
  }

  const boundedLimit = Math.max(
    1,
    Math.min(limit, 20)
  )

  return users
    .filter((user) =>
      user.name
        .toLocaleLowerCase()
        .includes(normalizedQuery)
    )
    .slice(0, boundedLimit)
    .map(({ id, name }) => ({
      id,
      name
    }))
}

export async function createUser(
  name: string
): Promise<UserProfile> {
  const normalizedName = name
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 100)

  if (normalizedName.length < 2) {
    throw new Error('invalid_name')
  }

  return withDbMutation(async () => {
    const users = await readUsers()

    const newUser: UserProfile = {
      id: `u-${randomUUID()}`,
      name: normalizedName,
      preferredWorkload: 16,
      completedCourseIds: [],
      degree: DEFAULT_DEGREE,
      degreeCourseIds: [
        ...DEFAULT_DEGREE_COURSE_IDS
      ],
      plannedCourses: {
        '1': [],
        '2': [],
        '3': []
      },
      createdAt: new Date().toISOString()
    }

    users.push(newUser)

    await writeUsers(users)

    return newUser
  })
}

export async function getUserById(
  id: string
): Promise<UserProfile | null> {
  const users = await readUsers()

  return (
    users.find(
      (user) => user.id === id
    ) ?? null
  )
}

export async function getPublicUserById(
  id: string
): Promise<PublicUser | null> {
  const user = await getUserById(id)

  return user ? toPublicUser(user) : null
}

export async function updateUserDegree(
  userId: string,
  degreePlanId: string
): Promise<PublicUser> {
  const normalizedPlanId =
    degreePlanId.trim()

  const degreePlan = degreePlans.find(
    (plan) => plan.id === normalizedPlanId
  )

  if (!degreePlan) {
    throw new Error('invalid_degree')
  }

  return withDbMutation(async () => {
    const users = await readUsers()

    const user = users.find(
      (candidate) =>
        candidate.id === userId
    )

    if (!user) {
      throw new Error('user_not_found')
    }

    user.degree = degreePlan.label
    user.degreeCourseIds = [
      ...degreePlan.courseIds
    ]

    /*
     * Remove planned courses that do not belong
     * to the newly selected degree.
     */
    const allowedCourseIds = new Set(
      degreePlan.courseIds
    )

    user.plannedCourses = {
      '1': (
        user.plannedCourses?.['1'] ?? []
      ).filter((courseId) =>
        allowedCourseIds.has(courseId)
      ),

      '2': (
        user.plannedCourses?.['2'] ?? []
      ).filter((courseId) =>
        allowedCourseIds.has(courseId)
      ),

      '3': (
        user.plannedCourses?.['3'] ?? []
      ).filter((courseId) =>
        allowedCourseIds.has(courseId)
      )
    }

    await writeUsers(users)

    return toPublicUser(user)
  })
}

export async function updateUserCompletedCourse(
  userId: string,
  courseId: string,
  completed: boolean
): Promise<PublicUser> {
  const course =
    findCourseOrThrow(courseId)

  return withDbMutation(async () => {
    const users = await readUsers()

    const user = users.find(
      (candidate) =>
        candidate.id === userId
    )

    if (!user) {
      throw new Error('user_not_found')
    }

    const completedCourseIds = new Set(
      user.completedCourseIds ?? []
    )

    if (completed) {
      completedCourseIds.add(course.id)

      /*
       * A course cannot be both completed and
       * planned. Remove it from every term.
       */
      user.plannedCourses = {
        '1': (
          user.plannedCourses?.['1'] ?? []
        ).filter(
          (plannedCourseId) =>
            plannedCourseId !== course.id
        ),

        '2': (
          user.plannedCourses?.['2'] ?? []
        ).filter(
          (plannedCourseId) =>
            plannedCourseId !== course.id
        ),

        '3': (
          user.plannedCourses?.['3'] ?? []
        ).filter(
          (plannedCourseId) =>
            plannedCourseId !== course.id
        )
      }
    } else {
      completedCourseIds.delete(course.id)
    }

    user.completedCourseIds = [
      ...completedCourseIds
    ]

    await writeUsers(users)

    return toPublicUser(user)
  })
}

export async function updateUserPlannedCourse(
  userId: string,
  term: string,
  courseId: string,
  planned: boolean
): Promise<PublicUser> {
  const normalizedTerm =
    normalizeTerm(term)

  const course =
    findCourseOrThrow(courseId)

  if (
    !course.terms.includes(
      normalizedTerm
    )
  ) {
    throw new Error(
      'course_not_offered_in_term'
    )
  }

  return withDbMutation(async () => {
    const users = await readUsers()

    const user = users.find(
      (candidate) =>
        candidate.id === userId
    )

    if (!user) {
      throw new Error('user_not_found')
    }

    /*
     * Completed courses cannot be added
     * to the planner.
     */
    if (
      planned &&
      (user.completedCourseIds ?? [])
        .includes(course.id)
    ) {
      throw new Error('invalid_state')
    }

    /*
     * Only allow courses that belong to the
     * user's selected degree plan.
     */
    const degreePlan = degreePlans.find(
      (plan) =>
        plan.id === user.degree ||
        plan.label === user.degree
    )

    const allowedCourseIds = degreePlan
      ? new Set(degreePlan.courseIds)
      : new Set(
          user.degreeCourseIds ?? []
        )

    if (
      allowedCourseIds.size > 0 &&
      !allowedCourseIds.has(course.id)
    ) {
      throw new Error('invalid_course')
    }

    const nextPlannedCourses = {
      ...(user.plannedCourses ?? {})
    }

    const plannedCourseIds = new Set(
      nextPlannedCourses[
        normalizedTerm
      ] ?? []
    )

    if (planned) {
      if (
        !plannedCourseIds.has(course.id) &&
        plannedCourseIds.size >=
          MAX_PLANNED_COURSES_PER_TERM
      ) {
        throw new Error(
          'plan_limit_exceeded'
        )
      }

      plannedCourseIds.add(course.id)
    } else {
      plannedCourseIds.delete(course.id)
    }

    nextPlannedCourses[
      normalizedTerm
    ] = [...plannedCourseIds]

    user.plannedCourses =
      nextPlannedCourses

    await writeUsers(users)

    return toPublicUser(user)
  })
}

